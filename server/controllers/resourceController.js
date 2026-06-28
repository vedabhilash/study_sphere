const Resource = require('../models/Resource');
const Group = require('../models/Group');
const fs = require('fs');
const path = require('path');

// @desc    Get resources for a group
// @route   GET /api/groups/:id/resources
// @access  Private
const getResources = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify membership
    const isMember = group.members.some(memberId => memberId.toString() === req.user.id);
    if (!isMember && group.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view resources in this group' });
    }

    const resources = await Resource.find({ groupId: req.params.id })
      .populate('uploadedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(resources);
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ message: 'Server error retrieving resources' });
  }
};

// @desc    Add a resource (file upload or web link)
// @route   POST /api/groups/:id/resources
// @access  Private
const createResource = async (req, res) => {
  const { title, type, tags, link } = req.body;
  const groupId = req.params.id;

  if (!title || !type) {
    return res.status(400).json({ message: 'Title and resource type are required' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify membership
    const isMember = group.members.some(memberId => memberId.toString() === req.user.id);
    if (!isMember && group.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to upload resources in this group' });
    }

    let fileUrl = '';
    
    if (type === 'link') {
      if (!link) {
        return res.status(400).json({ message: 'A valid URL link is required for link resources' });
      }
      fileUrl = link;
    } else {
      if (!req.file) {
        return res.status(400).json({ message: 'File upload is required for document/image resources' });
      }
      fileUrl = `/uploads/${req.file.filename}`;
    }

    // Parse tags (tags can be sent as JSON string or comma-separated string)
    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
      }
    }

    const resource = await Resource.create({
      groupId,
      uploadedBy: req.user.id,
      title,
      fileUrl,
      type,
      tags: parsedTags,
      likes: []
    });

    // Add resource reference to Group
    group.resources.push(resource._id);
    await group.save();

    const populatedResource = await resource.populate('uploadedBy', 'name email avatar');

    res.status(201).json(populatedResource);
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ message: 'Server error creating resource' });
  }
};

// @desc    Toggle like / bookmark resource
// @route   POST /api/resources/:id/like
// @access  Private
const toggleLikeResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const likeIndex = resource.likes.findIndex(likeId => likeId.toString() === req.user.id);
    if (likeIndex > -1) {
      // Unlike
      resource.likes.splice(likeIndex, 1);
    } else {
      // Like
      resource.likes.push(req.user.id);
    }

    await resource.save();
    
    const populatedResource = await resource.populate('uploadedBy', 'name email avatar');
    res.status(200).json(populatedResource);
  } catch (error) {
    console.error('Toggle like resource error:', error);
    res.status(500).json({ message: 'Server error liking/unliking resource' });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const group = await Group.findById(resource.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Associated study group not found' });
    }

    // Only uploader or group admin can delete
    const isUploader = resource.uploadedBy.toString() === req.user.id;
    const isAdmin = group.admin.toString() === req.user.id;

    if (!isUploader && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this resource' });
    }

    // If it is a local file, delete it from disk
    if (resource.type !== 'link' && resource.fileUrl.startsWith('/uploads/')) {
      const fileName = resource.fileUrl.replace('/uploads/', '');
      const filePath = path.join(__dirname, '../uploads', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove reference from group
    await Group.findByIdAndUpdate(resource.groupId, {
      $pull: { resources: resource._id }
    });

    // Delete resource document
    await Resource.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Resource deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Server error deleting resource' });
  }
};

module.exports = {
  getResources,
  createResource,
  toggleLikeResource,
  deleteResource
};
