class Territory < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true  # Links to User; optional for unclaimed turfs
  validates :name, presence: true  # Must have a name
  validates :lat, :lng, presence: true  # GPS required
end