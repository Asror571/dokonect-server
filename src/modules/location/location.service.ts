import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LocationService {
    // Nominatim (OpenStreetMap) - bepul geocoding API
    async getAddressFromCoordinates(lat: number, lng: number): Promise<any> {
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse`,
                {
                    params: {
                        lat,
                        lon: lng,
                        format: 'json',
                        'accept-language': 'uz',
                    },
                    headers: {
                        'User-Agent': 'Dokonect-App',
                    },
                },
            );

            const data = response.data;

            return {
                fullAddress: data.display_name,
                city: data.address?.city || data.address?.town || data.address?.village,
                district: data.address?.suburb || data.address?.neighbourhood,
                region: data.address?.state || data.address?.region,
                country: data.address?.country,
                postcode: data.address?.postcode,
                road: data.address?.road,
                houseNumber: data.address?.house_number,
                coordinates: {
                    lat,
                    lng,
                },
            };
        } catch (error) {
            console.error('Geocoding error:', error);
            return {
                fullAddress: `${lat}, ${lng}`,
                coordinates: { lat, lng },
            };
        }
    }

    // Google Maps Geocoding API (agar kerak bo'lsa)
    async getAddressFromCoordinatesGoogle(
        lat: number,
        lng: number,
    ): Promise<any> {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_MAPS_API_KEY not configured');
        }

        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json`,
                {
                    params: {
                        latlng: `${lat},${lng}`,
                        key: apiKey,
                        language: 'uz',
                    },
                },
            );

            if (response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                const components = result.address_components;

                return {
                    fullAddress: result.formatted_address,
                    components: components,
                    coordinates: {
                        lat,
                        lng,
                    },
                };
            }

            return {
                fullAddress: `${lat}, ${lng}`,
                coordinates: { lat, lng },
            };
        } catch (error) {
            console.error('Google Geocoding error:', error);
            return {
                fullAddress: `${lat}, ${lng}`,
                coordinates: { lat, lng },
            };
        }
    }
}
