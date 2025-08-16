import cron from 'node-cron';
import { Booking, BookingStatus } from '../models/booking.model';
import logger from '../../config/logger';

/**
 * Service to handle all cron jobs for the application
 */
class CronService {
  /**
   * Initialize all cron jobs
   */
  public static initCronJobs(): void {
    this.setupExpiredBookingsCheck();
    logger.info('Cron jobs initialized');
  }

  /**
   * Setup cron job to check for expired bookings
   * Runs every day at midnight (00:00)
   */
  private static setupExpiredBookingsCheck(): void {
    // Schedule the job to run at midnight every day
    cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('Running cron job: Check for expired bookings');
        
        const currentDate = new Date();
        
        // Find all confirmed bookings where checkout date has passed
        const expiredBookings = await Booking.find({
          bookingStatus: BookingStatus.CONFIRMED,
          checkOutDate: { $lt: currentDate }
        });
        
        if (expiredBookings.length === 0) {
          logger.info('No expired bookings found');
          return;
        }
        
        logger.info(`Found ${expiredBookings.length} expired bookings to mark as completed`);
        
        // Update all expired bookings to completed status
        const updateResult = await Booking.updateMany(
          {
            bookingStatus: BookingStatus.CONFIRMED,
            checkOutDate: { $lt: currentDate }
          },
          {
            $set: { bookingStatus: BookingStatus.COMPLETED }
          }
        );
        
        logger.info(`Successfully marked ${updateResult.modifiedCount} bookings as completed`);
      } catch (error) {
        logger.error('Error in expired bookings cron job:', error);
      }
    });
  }
}

export default CronService;
