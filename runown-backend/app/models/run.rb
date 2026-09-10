class Run < ApplicationRecord
  belongs_to :user
  belongs_to :territory, optional: true

  validates :user_id, presence: true
  validates :duration, numericality: { greater_than: 0 }, allow_nil: true

  # Recomputes `distance` from the recorded GPS path.
  def calculate_distance
    self.distance = GpsValidator.total_distance_meters(path)
  end

  # Marks the run verified if its GPS path actually passed through the
  # territory it claims to be for. `gps_data`, when given, replaces the
  # path recorded so far (e.g. the full trace sent up when the run ends).
  #
  # On success: saves the computed distance, flags the run verified, and -
  # if the territory is still unclaimed - hands ownership to this run's
  # user. Territories that already have an owner are left alone; taking one
  # over goes through a Challenge instead (see ChallengesController).
  def validate_run(gps_data = nil, duration: nil)
    self.path = gps_data if gps_data.present?
    self.duration = duration if duration.present?
    calculate_distance

    # A run doesn't have to declare its territory up front - if it wasn't
    # picked when the run started, work out which zone (if any) the
    # recorded path actually passed through.
    self.territory ||= find_territory_along_path

    return false if territory.nil?
    return false unless GpsValidator.path_intersects_territory?(path, territory)

    self.verified = true
    self.ended_at ||= Time.current

    transaction do
      save!
      territory.assign_owner!(user) if territory.owner_id.nil?
    end

    true
  end

  private

  def find_territory_along_path
    Array(path).lazy.filter_map { |point| Territory.near(point['lat'] || point[:lat], point['lng'] || point[:lng]) }.first
  end
end
