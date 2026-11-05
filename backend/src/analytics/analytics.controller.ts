import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(
    @Query('initDate') initDate?: string,
    @Query('finalDate') finalDate?: string,
  ) {
    return this.analyticsService.getSummaryStats(initDate, finalDate);
  }

  @Get('pageviews')
  async getPageViews(
    @Query('initDate') initDate?: string,
    @Query('finalDate') finalDate?: string,
    @Query('unit') unit: 'day' | 'month' | 'year' | 'hour' = 'day',
    @Query('timezone') timezone = 'America/Sao_Paulo',
  ) {
    return this.analyticsService.getPageViewsStats(
      initDate,
      finalDate,
      unit,
      timezone,
    );
  }

  @Get('top-news')
  async getTopNews(
    @Query('range') range?: 'day' | 'week' | 'month' | 'year' | 'all',
    @Query('initDate') initDate?: string,
    @Query('finalDate') finalDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopNews(
      range,
      initDate,
      finalDate,
      limit ? parseInt(limit, 10) : 5,
    );
  }
}
