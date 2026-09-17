require 'rails_helper'

RSpec.describe 'RunOwn API', type: :request do
  def json
    JSON.parse(response.body)
  end

  it 'signs up, logs in, claims an empty zone, and verifies a run through it' do
    post '/api/signup', params: { name: 'Padma', email: 'padma@example.com', password: 'password123' }
    expect(response).to have_http_status(:created)
    token = json['token']
    headers = { 'Authorization' => "Bearer #{token}" }

    post '/api/territories/claim', params: { name: 'Waterloo Park', lat: 43.4643, lng: -80.5204 }, headers: headers
    expect(response).to have_http_status(:ok)
    territory_id = json['territory']['id']

    post '/api/runs/start', params: { territory_id: territory_id, duration: 20 }, headers: headers
    expect(response).to have_http_status(:created)
    run_id = json['id']

    post "/api/runs/#{run_id}/verify",
         params: { gps_data: [{ lat: 43.4643, lng: -80.5204 }] },
         headers: headers
    expect(response).to have_http_status(:ok)
    expect(json['run']['verified']).to be true
  end

  it 'rejects claiming a territory someone else already owns' do
    owner = create(:user)
    create(:territory, name: 'Taken Turf', lat: 1.0, lng: 1.0, owner: owner)

    post '/api/signup', params: { name: 'Rival', email: 'rival@example.com', password: 'password123' }
    headers = { 'Authorization' => "Bearer #{json['token']}" }

    post '/api/territories/claim', params: { lat: 1.0, lng: 1.0 }, headers: headers
    expect(response).to have_http_status(:conflict)
  end

  it 'requires authentication to start a run' do
    post '/api/runs/start', params: { duration: 20 }
    expect(response).to have_http_status(:unauthorized)
  end

  it 'rejects a claim that would require teleporting since the last one' do
    post '/api/signup', params: { name: 'Speedy', email: 'speedy@example.com', password: 'password123' }
    headers = { 'Authorization' => "Bearer #{json['token']}" }

    post '/api/territories/claim', params: { lat: 43.4643, lng: -80.5204 }, headers: headers
    expect(response).to have_http_status(:ok)

    # Tokyo, immediately after claiming in Waterloo - no human covers that
    # distance in zero seconds, so this must be rejected rather than trusted.
    post '/api/territories/claim', params: { lat: 35.6762, lng: 139.6503 }, headers: headers
    expect(response).to have_http_status(:unprocessable_entity)
    expect(json['error']).to match(/too far|seconds between claims/)
  end
end
