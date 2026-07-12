const Joi = require('joi');

// Regex for password: min 8 characters, at least one uppercase, one lowercase, one number, and one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email address'
  }),
  password: Joi.string().pattern(passwordRegex).required().messages({
    'string.empty': 'Password is required',
    'string.pattern.base': 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email address'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

const groupSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.empty': 'Group name is required',
    'string.min': 'Group name must be at least 3 characters long',
    'string.max': 'Group name cannot exceed 100 characters'
  }),
  description: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  subject: Joi.string().trim().required().messages({
    'string.empty': 'Subject is required'
  }),
  isPrivate: Joi.any().optional()
});

const sessionSchema = Joi.object({
  partnerId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'Partner ID is required',
    'string.length': 'Invalid partner ID format'
  }),
  skill: Joi.string().trim().required().messages({
    'string.empty': 'Skill name is required'
  }),
  date: Joi.date().iso().greater('now').required().messages({
    'any.required': 'Date is required',
    'date.greater': 'Session date must be in the future',
    'date.format': 'Date must be a valid ISO format'
  }),
  duration: Joi.number().integer().min(15).max(180).required().messages({
    'number.min': 'Duration must be at least 15 minutes',
    'number.max': 'Duration cannot exceed 180 minutes',
    'any.required': 'Duration is required'
  }),
  meetingType: Joi.string().valid('Video', 'Chat', 'In Person').optional(),
  notes: Joi.string().trim().max(1000).allow('').optional()
});

const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({ 
        message: errorMessages[0], // Send first error as primary message
        errors: errorMessages 
      });
    }
    next();
  };
};

module.exports = {
  validateRegister: validateBody(registerSchema),
  validateLogin: validateBody(loginSchema),
  validateGroup: validateBody(groupSchema),
  validateSession: validateBody(sessionSchema)
};
