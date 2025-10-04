import User from '../models/User.js';
import { generateSecurePassword } from '../utils/passwordGenerator.js';
import { sendPasswordEmail } from '../services/emailService.js';

// @desc    Get all users (for admin)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ company: req.user.company._id })
      .select('-password')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });

    // Get all managers for dropdown
    const managers = await User.find({ 
      company: req.user.company._id,
      role: { $in: ['manager', 'admin'] }
    }).select('name email');

    res.json({ users, managers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create user and send password via email
// @route   POST /api/users/create-send-password
// @access  Private/Admin
export const createUserAndSendPassword = async (req, res) => {
  try {
    const { name, email, role, manager } = req.body;

    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Please provide name, email, and role' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    
    // Generate secure password
    const generatedPassword = generateSecurePassword(12);

    if (user) {
      // User exists, update password
      user.password = generatedPassword;
      if (role !== 'admin') {
        user.role = role;
      }
      if (manager && role === 'employee') {
        user.manager = manager;
      } else {
        user.manager = null;
      }
      await user.save();
      
      // Send password email
      const emailResult = await sendPasswordEmail(email, name, generatedPassword, false);
      
      if (emailResult.success) {
        res.json({ 
          message: 'Password reset and sent successfully!',
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        });
      } else {
        // Email failed, but password was updated - return password for manual sharing
        res.json({ 
          message: 'Password updated but email failed. Please share this password manually.',
          password: generatedPassword,
          emailError: emailResult.error,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        });
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        password: generatedPassword,
        role,
        company: req.user.company._id,
        manager: (role === 'employee' && manager) ? manager : null,
      });

      // Send password email
      const emailResult = await sendPasswordEmail(email, name, generatedPassword, true);
      
      await user.populate('manager', 'name email');
      
      if (emailResult.success) {
        res.status(201).json({ 
          message: 'User created and password sent successfully!',
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            manager: user.manager,
          }
        });
      } else {
        // Email failed, but user was created - return password for manual sharing
        res.status(201).json({ 
          message: 'User created but email failed. Please share this password manually.',
          password: generatedPassword,
          emailError: emailResult.error,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            manager: user.manager,
          }
        });
      }
    }
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const { role, manager } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user belongs to same company
    if (user.company.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Don't allow changing admin role
    if (user.role === 'admin' && role && role !== 'admin') {
      return res.status(403).json({ message: 'Cannot change admin role' });
    }

    if (role) user.role = role;
    if (manager !== undefined) {
      user.manager = manager || null;
    }

    await user.save();
    await user.populate('manager', 'name email');

    res.json({ 
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        manager: user.manager,
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user belongs to same company
    if (user.company.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this user' });
    }

    // Don't allow deleting admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

