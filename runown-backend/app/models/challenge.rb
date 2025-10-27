class Challenge < ApplicationRecord
  belongs_to :challenger, class_name: 'User'
  belongs_to :territory

  enum status: { pending: 0, accepted: 1, completed: 2, declined: 3 }

  validates :challenger_id, presence: true
  validates :territory_id, presence: true
  validates :status, inclusion: { in: statuses.keys }

  # Additional methods for managing challenge states can be added here
end