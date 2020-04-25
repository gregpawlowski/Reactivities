import { IAttendee } from './attendee';
import { IComment } from './comment';

export interface IActivity {
  id: string;
  title: string;
  description: string;
  category: string;
  date: Date;
  city: string;
  venue: string;
  attendees?: IAttendee[];
  isHost?: boolean;
  isGoing?: boolean;
  comments?: IComment[];
}
