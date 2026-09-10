FactoryBot.define do
  factory :run do
    user
    territory { nil }
    duration { 30 }
  end
end
