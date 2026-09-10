FactoryBot.define do
  factory :territory do
    sequence(:name) { |n| "Zone #{n}" }
    lat { 40.785091 }
    lng { -73.968285 }
    owner { nil }
  end
end
