const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get dashboard data
// @route   GET /dashboard
// @access  Private
const getDashboardData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('dashboard')
    .populate('dashboard.pinnedProjects', 'name description status');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user.dashboard);
});

// @desc    Update dashboard data
// @route   PUT /dashboard
// @access  Private
const updateDashboardData = asyncHandler(async (req, res) => {
  const { activeToday, miniNote, pinnedProjects } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update activeToday if provided
  if (activeToday) {
    user.dashboard.activeToday = {
      ...user.dashboard.activeToday,
      ...activeToday,
      lastUpdate: new Date()
    };
  }

  // Update miniNote if provided
  if (miniNote !== undefined) {
    user.dashboard.miniNote = miniNote;
  }

  // Update pinnedProjects if provided
  if (pinnedProjects) {
    user.dashboard.pinnedProjects = pinnedProjects;
  }

  await user.save();
  res.json(user.dashboard);
});

// @desc    Update active time
// @route   PUT /dashboard/active-time
// @access  Private
const updateActiveTime = asyncHandler(async (req, res) => {
  const { hours, minutes } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Get current date
  const currentDate = new Date();
  const today = currentDate.toISOString().split('T')[0];

  // Check if we need to reset activeToday and update weeklyActivity
  if (user.dashboard.activeToday.lastUpdate) {
    const lastUpdateDate = new Date(user.dashboard.activeToday.lastUpdate);
    const lastUpdateDay = lastUpdateDate.toISOString().split('T')[0];

    if (lastUpdateDay !== today) {
      // Reset activeToday
      user.dashboard.activeToday = {
        hours: 0,
        minutes: 0,
        lastUpdate: currentDate
      };

      // Add yesterday's activity to weeklyActivity
      user.dashboard.weeklyActivity.push({
        day: lastUpdateDate.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: user.dashboard.activeToday.hours,
        date: lastUpdateDay
      });

      // Remove entries older than one week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      user.dashboard.weeklyActivity = user.dashboard.weeklyActivity.filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate >= oneWeekAgo;
      });
    }
  }

  // Update active time
  user.dashboard.activeToday = {
    hours: hours || user.dashboard.activeToday.hours,
    minutes: minutes || user.dashboard.activeToday.minutes,
    lastUpdate: currentDate
  };

  await user.save();
  res.json(user.dashboard);
});

// @desc    Update weekly activity
// @route   PUT /dashboard/weekly-activity
// @access  Private
const updateWeeklyActivity = asyncHandler(async (req, res) => {
  const { weeklyActivity } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.dashboard.weeklyActivity = weeklyActivity;
  await user.save();
  res.json(user.dashboard.weeklyActivity);
});

// @desc    Update mini note
// @route   PUT /dashboard/mini-note
// @access  Private
const updateMiniNote = asyncHandler(async (req, res) => {
  const { note } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.dashboard.miniNote = note;
  await user.save();
  res.json({ miniNote: user.dashboard.miniNote });
});

// @desc    Update pinned projects
// @route   PUT /dashboard/pinned-projects
// @access  Private
const updatePinnedProjects = asyncHandler(async (req, res) => {
  const { projectIds } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.dashboard.pinnedProjects = projectIds;
  await user.save();

  const updatedUser = await User.findById(req.user._id)
    .populate('dashboard.pinnedProjects', 'name status');

  res.json(updatedUser.dashboard.pinnedProjects);
});

module.exports = {
  getDashboardData,
  updateDashboardData,
  updateActiveTime,
  updateWeeklyActivity,
  updateMiniNote,
  updatePinnedProjects
}; 