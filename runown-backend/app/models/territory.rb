class Territory < ApplicationRecord
  validates :name, presence: true
  validates :latitude, presence: true
  validates :longitude, presence: true
  validates :owner_id, presence: true

  belongs_to :owner, class_name: 'User'

  # Additional methods for ownership checks and territory logic can be added here
end