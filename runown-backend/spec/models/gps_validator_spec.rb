require 'rails_helper'

RSpec.describe GpsValidator do
  describe '.haversine_distance_meters' do
    it 'is zero for the same point' do
      expect(described_class.haversine_distance_meters(40.7, -73.9, 40.7, -73.9)).to eq(0)
    end

    it 'roughly matches the known distance between two well known cities' do
      # New York to Los Angeles is ~3,936 km
      distance = described_class.haversine_distance_meters(40.7128, -74.0060, 34.0522, -118.2437)
      expect(distance).to be_within(20_000).of(3_936_000)
    end
  end

  describe '.total_distance_meters' do
    it 'sums the distance between consecutive points' do
      path = [{ 'lat' => 40.0, 'lng' => -73.0 }, { 'lat' => 40.001, 'lng' => -73.0 }, { 'lat' => 40.002, 'lng' => -73.0 }]
      leg = described_class.haversine_distance_meters(40.0, -73.0, 40.001, -73.0)
      expect(described_class.total_distance_meters(path)).to be_within(0.01).of(leg * 2)
    end

    it 'is zero for fewer than two points' do
      expect(described_class.total_distance_meters([{ 'lat' => 1, 'lng' => 1 }])).to eq(0.0)
      expect(described_class.total_distance_meters(nil)).to eq(0.0)
    end
  end

  describe '.path_intersects_territory?' do
    let(:territory) { build(:territory, lat: 40.0, lng: -73.0) }

    it 'is true when a point in the path is within the claim radius' do
      path = [{ 'lat' => 40.0, 'lng' => -73.0 }]
      expect(described_class.path_intersects_territory?(path, territory)).to be true
    end

    it 'is false when every point is far away' do
      path = [{ 'lat' => 41.0, 'lng' => -74.0 }]
      expect(described_class.path_intersects_territory?(path, territory)).to be false
    end
  end
end
