class Run < ApplicationRecord
  belongs_to :user
  belongs_to :territory

  validates :user_id, presence: true
  validates :territory_id, presence: true
  validates :duration, numericality: { greater_than: 0 }

  # Method to calculate distance (placeholder for future implementation)
  def calculate_distance
    # Logic to calculate distance based on GPS coordinates
  end

  # Method to validate run (placeholder for future implementation)
  def validate_run
    # Logic to validate run based on territory and user data
  end
end