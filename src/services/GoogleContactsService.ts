import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

export class GoogleContactsService {
  private people;

  constructor() {
    const auth = new GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/contacts.readonly",
        "https://www.googleapis.com/auth/contacts",
        "https://www.googleapis.com/auth/directory.readonly"
      ]
    });

    this.people = google.people({ version: "v1", auth });
  }

  async getTodaysBirthdays(): Promise<string[]> {
    try {
      const response = await this.people.otherContacts.list({
        readMask: "names,birthdays",
        pageSize: 1000
      });

      console.log("response 1", response);

      // const today = new Date();
      // const month = today.getMonth() + 1; // getMonth() возвращает 0-11
      // const day = today.getDate();

      // const birthdays: string[] = [];

      // const connections = response.data || [];
      // for (const person of connections) {
      //   if (person.birthdays && person.birthdays.length > 0) {
      //     for (const birthday of person.birthdays) {
      //       if (birthday.date && birthday.date.month === month && birthday.date.day === day) {
      //         const name =
      //           person.names && person.names.length > 0
      //             ? person.names[0].displayName || "Неизвестный контакт"
      //             : "Неизвестный контакт";
      //         birthdays.push(name);
      //       }
      //     }
      //   }
      // }

      return [];
    } catch (error) {
      console.error("Error fetching contacts:", error);
      return [];
    }
  }
}
