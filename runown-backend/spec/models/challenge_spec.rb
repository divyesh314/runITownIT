require 'rails_helper'

RSpec.describe Challenge, type: :model do
  let(:owner) { create(:user) }
  let(:challenger) { create(:user) }
  let(:territory) { create(:territory, owner: owner) }

  it 'cannot be created against an unclaimed territory' do
    unclaimed = create(:territory, owner: nil)
    challenge = Challenge.new(challenger: challenger, territory: unclaimed)
    expect(challenge).not_to be_valid
  end

  it 'cannot be created by the territory owner against themselves' do
    challenge = Challenge.new(challenger: owner, territory: territory)
    expect(challenge).not_to be_valid
  end

  describe '#complete!' do
    let(:challenge) { create(:challenge, challenger: challenger, territory: territory) }

    it 'transfers the territory to the challenger when they win' do
      challenge.complete!(winner: challenger)

      expect(challenge).to be_completed
      expect(territory.reload.owner).to eq(challenger)
    end

    it 'leaves the territory with its owner when the owner wins' do
      challenge.complete!(winner: owner)

      expect(territory.reload.owner).to eq(owner)
    end

    it 'rejects a winner who was not part of the challenge' do
      bystander = create(:user)
      expect { challenge.complete!(winner: bystander) }.to raise_error(ArgumentError)
    end
  end
end
