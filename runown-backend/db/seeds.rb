# Populates a local database with a couple of users, two territories (one
# owned, one still up for grabs), a finished run, and a pending challenge -
# enough to poke around the API or point the mobile app / web dashboard at.
#
#   bin/rails db:seed

alice = User.find_or_create_by!(email: 'alice@example.com') do |u|
  u.name = 'Alice'
  u.password = 'password123'
end

bob = User.find_or_create_by!(email: 'bob@example.com') do |u|
  u.name = 'Bob'
  u.password = 'password123'
end

central_park = Territory.find_or_create_by!(name: 'Central Park') do |t|
  t.lat = 40.785091
  t.lng = -73.968285
end
central_park.assign_owner!(alice) unless central_park.claimed?

golden_gate_park = Territory.find_or_create_by!(name: 'Golden Gate Park') do |t|
  t.lat = 37.769420
  t.lng = -122.486213
end
# Left unclaimed on purpose so you can try POST /api/territories/claim against it.

Run.find_or_create_by!(user: alice, territory: central_park) do |r|
  r.duration = 30
  r.verified = true
  r.path = [
    { lat: 40.7849, lng: -73.9684 },
    { lat: 40.7851, lng: -73.9681 },
    { lat: central_park.lat, lng: central_park.lng }
  ]
  r.distance = GpsValidator.total_distance_meters(r.path)
  r.started_at = 1.hour.ago
  r.ended_at = 30.minutes.ago
end

Challenge.find_or_create_by!(challenger: bob, territory: central_park) do |c|
  c.status = :pending
end

puts "Seeded #{User.count} users, #{Territory.count} territories, #{Run.count} runs, #{Challenge.count} challenges."
