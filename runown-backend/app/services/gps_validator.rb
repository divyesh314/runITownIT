# Turns a raw list of GPS points into a distance and a yes/no answer to
# "did this run pass through this territory?". This is a deliberately simple
# stand-in for the H3/PostGIS-based hex-grid system described in the top
# level README - it treats each territory as a circle (its lat/lng plus
# Territory::CLAIM_RADIUS_METERS) rather than a real hexagon polygon. Good
# enough to prove the claim/challenge flow end-to-end; swapping in real
# spatial boundaries later would only mean changing the two methods below.
class GpsValidator
  EARTH_RADIUS_METERS = 6_371_000

  # Great-circle distance between two lat/lng points, in meters.
  def self.haversine_distance_meters(lat1, lng1, lat2, lng2)
    return 0.0 if lat1.nil? || lng1.nil? || lat2.nil? || lng2.nil?

    rad = ->(deg) { deg * Math::PI / 180 }

    d_lat = rad.call(lat2 - lat1)
    d_lng = rad.call(lng2 - lng1)

    a = (Math.sin(d_lat / 2)**2) +
        (Math.cos(rad.call(lat1)) * Math.cos(rad.call(lat2)) * (Math.sin(d_lng / 2)**2))
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    EARTH_RADIUS_METERS * c
  end

  # Total length of a run, in meters: the sum of the distance between each
  # consecutive pair of points in `path`.
  #
  # path: [{"lat" => 40.78, "lng" => -73.96}, {"lat" => 40.781, "lng" => -73.961}, ...]
  def self.total_distance_meters(path)
    points = Array(path)
    return 0.0 if points.size < 2

    points.each_cons(2).sum do |a, b|
      haversine_distance_meters(a['lat'] || a[:lat], a['lng'] || a[:lng],
                                 b['lat'] || b[:lat], b['lng'] || b[:lng])
    end
  end

  # Did any point in `path` come within claiming distance of `territory`?
  def self.path_intersects_territory?(path, territory)
    return false if territory.nil?

    Array(path).any? do |point|
      lat = point['lat'] || point[:lat]
      lng = point['lng'] || point[:lng]
      haversine_distance_meters(lat, lng, territory.lat, territory.lng) <= Territory::CLAIM_RADIUS_METERS
    end
  end
end
