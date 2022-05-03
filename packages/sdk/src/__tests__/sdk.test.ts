import sdk from '../index';

describe('Cal.com SDK', () => {
  sdk.auth(process.env.CAL_API_KEY);
  describe('Users', () => {
    // API Routes
    it(`sdk.get('/users') should return a list of users`, async () => {
      await sdk.get('/users').then((users: any) => {
        expect(users).toBeTruthy();
      });
    });
    it(`sdk.get('/users/4') should return a user`, async () => {
      await sdk.get('/users/4').then((users: any) => {
        expect(users).toBeTruthy();
      });
    });
    // Operation IDs
    it('sdk.listUsers() returns a list of users', async () => {
      await sdk.listUsers().then((users: any) => {
        expect(users).toBeTruthy();
      });
    });

    it('sdk.getUserById() returns a user', async () => {
      await sdk
        .getUserById({
          id: 4,
        })
        .then((data: any) => {
          expect(data.user).toBeTruthy();
        });
    });
    it('sdk.editUserById() edits a user', async () => {
      await sdk
        .editUserById(
          {
            timeZone: 'Europe/Madrid',
          },
          {
            id: 4,
          },
        )
        .then((data: any) => {
          expect(data.user).toBeTruthy();
          expect(data.user.timeZone).toBe('Europe/Madrid');
        });
    });
    let newUser: any;
    newUser &&
      it('sdk.removeUserById() should remove an user', async () => {
        await sdk
          .removeUserById({
            id: newUser.data.id,
          })
          .then((data: any) => {
            expect(data.message).toBeTruthy();
          });
      });
  });

  describe('Attendees', () => {
    // Attendees
    it('should return a list of attendees', async () => {
      await sdk.listAttendees().then((data: any) => {
        expect(data.attendees).toBeTruthy();
      });
    });
    it('should return an attendee by ID', async () => {
      await sdk
        .getAttendeeById({
          id: 25,
        })
        .then((data: any) => {
          expect(data.attendee).toBeTruthy();
          expect(data.attendee.timeZone).toBe('Europe/Madrid');
        });
    });
    it('should edit an attendee', async () => {
      await sdk
        .editAttendeeById(
          {
            timeZone: 'Europe/Madrid',
          },
          {
            id: 25,
          },
        )
        .then((data: any) => {
          expect(data.attendee).toBeTruthy();
          expect(data.attendee.timeZone).toBe('Europe/Madrid');
        });
    });
    let newAttendee: any;
    it('should create a new attendee', async () => {
      await sdk
        .addAttendee({
          bookingId: 1,
          name: 'John Doe',
          email: 'john@doe.com',
          timeZone: 'Europe/Madrid',
        })
        .then((data: any) => {
          newAttendee = data.attendee;
          expect(data.attendee).toBeTruthy();
          expect(data.attendee.timeZone).toBe('Europe/Madrid');
        });
    });
    newAttendee &&
      it('should remove an attendee', async () => {
        await sdk
          .removeAttendeeById({
            id: newAttendee.data.id,
          })
          .then((data: any) => {
            expect(data.message).toBeTruthy();
          });
      });
  });
  describe('Availabilities', () => {
    // Availabilities
    it('should return a list of availabilities', async () => {
      await sdk.listAvailabilities().then((data: any) => {
        expect(data.availabilities).toBeTruthy();
      });
    });
    it('should return an availability by ID', async () => {
      await sdk
        .getAvailabilityById({
          id: 1,
        })
        .then((data: any) => {
          expect(data.availability).toBeTruthy();
          expect(data.availability.days).toHaveLength(4);
        });
    });
    it('should edit an availability', async () => {
      await sdk
        .editAvailabilityById(
          {
            endTime: new Date(),
            days: [1, 2, 3, 4],
          },
          {
            id: 1,
          },
        )
        .then((data: any) => {
          expect(data.availability).toBeTruthy();
          expect(data.availability.days).toMatchObject([1, 2, 3, 4]);
        });
    });
    let newAvailability: any;
    it('should create a new availability', async () => {
      await sdk
        .addAvailability({
          days: [1, 2, 3, 4, 5],
          startTime: '1970-01-01T09:00:00.000Z',
          endTime: '1970-01-01T17:00:00.000Z',
        })
        .then((data: any) => {
          newAvailability = data.availability;
          expect(data.availability).toBeTruthy();
          expect(data.availability.days).toHaveLength(5);
        });
    });
    newAvailability &&
      it('should remove an availability', async () => {
        await sdk
          .removeAvailabilityById({
            id: newAvailability.data.id,
          })
          .then((data: any) => {
            expect(data.message).toBeTruthy();
          });
      });
  });
});
