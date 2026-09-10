FactoryBot.define do
  factory :user do
    sequence(:name) { |n| "Runner #{n}" }
    sequence(:email) { |n| "runner#{n}@example.com" }
    password { 'password123' }
  end
end
