require 'rails_helper'

RSpec.describe Run, type: :model do
  let(:runner) { create(:user) }
  let(:territory) { create(:territory, lat: 40.0, lng: -73.0) }

  describe '#validate_run' do
    it 'verifies the run and hands over an unclaimed territory when the path passes through it' do
      run = create(:run, user: runner, territory: territory)
      path = [{ lat: 39.999, lng: -73.0 }, { lat: 40.0, lng: -73.0 }]

      expect(run.validate_run(path)).to be true
      expect(run.reload).to be_verified
      expect(run.distance).to be > 0
      expect(territory.reload.owner).to eq(runner)
    end

    it 'does not verify or claim anything when the path never reaches the territory' do
      run = create(:run, user: runner, territory: territory)
      path = [{ lat: 45.0, lng: -73.0 }]

      expect(run.validate_run(path)).to be false
      expect(run.reload).not_to be_verified
      expect(territory.reload.owner).to be_nil
    end

    it 'leaves an already-owned territory alone even if the path passes through it' do
      owner = create(:user)
      territory.update!(owner: owner)
      run = create(:run, user: runner, territory: territory)

      expect(run.validate_run([{ lat: 40.0, lng: -73.0 }])).to be true
      expect(territory.reload.owner).to eq(owner)
    end

    it 'finds the territory itself from the path when the run did not pick one up front' do
      territory
      run = create(:run, user: runner, territory: nil)

      expect(run.validate_run([{ lat: 40.0, lng: -73.0 }])).to be true
      expect(run.reload.territory).to eq(territory)
    end
  end
end
