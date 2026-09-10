class Challenge < ApplicationRecord
  belongs_to :challenger, class_name: 'User', inverse_of: :challenges
  belongs_to :territory
  belongs_to :winner, class_name: 'User', optional: true

  enum status: { pending: 0, accepted: 1, completed: 2, declined: 3 }

  validates :challenger_id, presence: true
  validates :territory_id, presence: true
  validate :territory_must_be_owned, on: :create
  validate :cannot_challenge_own_territory, on: :create

  def accept!
    update!(status: :accepted)
  end

  def decline!
    update!(status: :declined)
  end

  # Settles the challenge: `winner` must be either the challenger or the
  # territory's current owner. The winner keeps/takes ownership of the
  # territory; the loser gets nothing (no coins, no penalty - see README,
  # the reward/token side of this is intentionally not built here).
  def complete!(winner:)
    raise ArgumentError, 'winner must be the challenger or the current owner' unless
      [challenger_id, territory.owner_id].include?(winner.id)

    transaction do
      update!(status: :completed, winner: winner)
      territory.assign_owner!(winner) if territory.owner_id != winner.id
    end
  end

  private

  def territory_must_be_owned
    errors.add(:territory, "must already have an owner - run through it to claim it instead of challenging for it") if
      territory && territory.owner_id.nil?
  end

  def cannot_challenge_own_territory
    errors.add(:territory, 'you already own this territory') if
      territory && territory.owner_id == challenger_id
  end
end
