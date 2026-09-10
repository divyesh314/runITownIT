# GET /api/leaderboard - ranks players by how many territories they
# currently own. No points/coins here (see README) - just a turf count.
class LeaderboardController < ApplicationController
  def index
    rows = User
           .left_joins(:territories)
           .group('users.id')
           .select('users.id, users.name, COUNT(territories.id) AS territories_count')
           .order('territories_count DESC, users.name ASC')
           .limit(100)

    render json: rows.map { |u| { id: u.id, name: u.name, territories_count: u.territories_count.to_i } }
  end
end
