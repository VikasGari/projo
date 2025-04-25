const cron = require('node-cron');
const User = require('./models/User');

// Schedule task to run at midnight every day
cron.schedule('0 0 * * *', async () => {
  try {
    // Get all users
    const users = await User.find({});
    
    // For each user, reset activeToday and update weeklyActivity
    for (const user of users) {
      if (user.activeToday > 0) {
        // Add today's activity to weeklyActivity
        user.weeklyActivity.push({
          date: new Date(),
          count: user.activeToday
        });
        
        // Remove entries older than 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        user.weeklyActivity = user.weeklyActivity.filter(activity => 
          new Date(activity.date) >= oneWeekAgo
        );
        
        // Reset activeToday
        user.activeToday = 0;
        await user.save();
      }
    }
    
    console.log('Daily reset of active time completed successfully');
  } catch (error) {
    console.error('Error in daily reset task:', error);
  }
});

module.exports = cron; 