FactoryBot.define do
  factory :challenge do
    challenger factory: :user
    territory

    # A challenge is only valid against an already-owned territory, so give
    # the territory an owner (someone other than the challenger) by default.
    after(:build) do |challenge|
      next if challenge.territory.owner_id.present?

      challenge.territory.update!(owner: create(:user))
    end
  end
end
