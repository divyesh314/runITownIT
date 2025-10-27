# db/seeds.rb

# This file is used to populate the database with initial data.

# Create sample users
user1 = User.create(name: 'Alice', email: 'alice@example.com', password: 'password123')
user2 = User.create(name: 'Bob', email: 'bob@example.com', password: 'password123')

# Create sample territories
territory1 = Territory.create(name: 'Central Park', gps_latitude: 40.785091, gps_longitude: -73.968285, owner_id: user1.id)
territory2 = Territory.create(name: 'Golden Gate Park', gps_latitude: 37.769420, gps_longitude: -122.486213, owner_id: user2.id)

# Create sample runs
run1 = Run.create(user_id: user1.id, territory_id: territory1.id, duration: 30) # duration in minutes
run2 = Run.create(user_id: user2.id, territory_id: territory2.id, duration: 45)

# Create sample challenges
challenge1 = Challenge.create(challenger_id: user1.id, territory_id: territory1.id, status: 'pending')
challenge2 = Challenge.create(challenger_id: user2.id, territory_id: territory2.id, status: 'accepted')