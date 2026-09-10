class Territory < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true

  has_many :runs, dependent: :nullify
  has_many :challenges, dependent: :destroy

  validates :name, presence: true
  validates :lat, :lng, presence: true

  # How close a run has to pass to this territory's center point to count as
  # "running through it", in meters. A simplified stand-in for a real
  # hex-grid boundary (no PostGIS/H3 set up in this project yet).
  CLAIM_RADIUS_METERS = 75

  scope :unclaimed, -> { where(owner_id: nil) }
  scope :owned_by, ->(user) { where(owner_id: user.id) }

  # Finds the territory whose center is within CLAIM_RADIUS_METERS of the
  # given point, if one exists yet.
  def self.near(lat, lng)
    all.min_by { |t| GpsValidator.haversine_distance_meters(lat, lng, t.lat, t.lng) }
       &.then { |t| t if GpsValidator.haversine_distance_meters(lat, lng, t.lat, t.lng) <= CLAIM_RADIUS_METERS }
  end

  def claimed?
    owner_id.present?
  end

  def assign_owner!(user)
    update!(owner: user, claimed_at: Time.current)
  end
end
