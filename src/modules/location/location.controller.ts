import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LocationService } from './location.service';

@ApiTags('Location')
@Controller('location')
export class LocationController {
    constructor(private locationService: LocationService) { }

    @Get('reverse-geocode')
    @ApiOperation({ summary: 'Lat/Long dan manzil nomini olish' })
    @ApiQuery({ name: 'lat', type: Number, example: 41.2995 })
    @ApiQuery({ name: 'lng', type: Number, example: 69.2401 })
    @ApiQuery({
        name: 'provider',
        required: false,
        enum: ['osm', 'google'],
        example: 'osm',
    })
    async reverseGeocode(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('provider') provider: string = 'osm',
    ) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            return {
                error: 'Invalid coordinates',
                message: 'Lat va lng raqam bo\'lishi kerak',
            };
        }

        if (provider === 'google') {
            return this.locationService.getAddressFromCoordinatesGoogle(
                latitude,
                longitude,
            );
        }

        return this.locationService.getAddressFromCoordinates(latitude, longitude);
    }
}
