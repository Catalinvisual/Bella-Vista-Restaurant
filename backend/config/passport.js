const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');

module.exports = (passport, pool) => {
  // Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          // Check if user exists
          const userQuery = 'SELECT * FROM users WHERE email = $1';
          const userResult = await pool.query(userQuery, [email]);
          
          if (userResult.rows.length === 0) {
            return done(null, false, { message: 'No user found with that email' });
          }
          
          const user = userResult.rows[0];
          
          // Check if account is active
          if (!user.is_active) {
            return done(null, false, { message: 'Account is deactivated' });
          }
          
          // Check password
          const isMatch = await bcrypt.compare(password, user.password);
          
          if (!isMatch) {
            return done(null, false, { message: 'Incorrect password' });
          }
          
          // Remove password from user object
          const { password: userPassword, ...userWithoutPassword } = user;
          
          return done(null, userWithoutPassword);
        } catch (error) {
          console.error('Error in local strategy:', error);
          return done(error);
        }
      }
    )
  );
  
  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let userQuery = 'SELECT * FROM users WHERE google_id = $1';
          let userResult = await pool.query(userQuery, [profile.id]);
          
          if (userResult.rows.length > 0) {
            // User exists, return user
            const user = userResult.rows[0];
            const { password, ...userWithoutPassword } = user;
            return done(null, userWithoutPassword);
          }
          
          // Check if user exists with same email
          userQuery = 'SELECT * FROM users WHERE email = $1';
          userResult = await pool.query(userQuery, [profile.emails[0].value]);
          
          if (userResult.rows.length > 0) {
            // User exists with same email, link Google account
            const updateQuery = `
              UPDATE users 
              SET google_id = $1, updated_at = CURRENT_TIMESTAMP 
              WHERE email = $2 
              RETURNING *
            `;
            const updateResult = await pool.query(updateQuery, [
              profile.id,
              profile.emails[0].value
            ]);
            
            const user = updateResult.rows[0];
            const { password, ...userWithoutPassword } = user;
            return done(null, userWithoutPassword);
          }
          
          // Create new user
          const insertQuery = `
            INSERT INTO users (full_name, email, google_id, is_active, email_verified, created_at, updated_at)
            VALUES ($1, $2, $3, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
          `;
          
          const insertResult = await pool.query(insertQuery, [
            profile.displayName,
            profile.emails[0].value,
            profile.id
          ]);
          
          const newUser = insertResult.rows[0];
          const { password, ...userWithoutPassword } = newUser;
          
          return done(null, userWithoutPassword);
        } catch (error) {
          console.error('Error in Google strategy:', error);
          return done(error);
        }
      }
    )
  );
  
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const userQuery = 'SELECT * FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [id]);
      
      if (userResult.rows.length === 0) {
        return done(null, false);
      }
      
      const user = userResult.rows[0];
      const { password, ...userWithoutPassword } = user;
      
      done(null, userWithoutPassword);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error);
    }
  });
};