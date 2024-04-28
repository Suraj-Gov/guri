# guri

An over-engineered goal tracking webapp.  

- User can add their goals and assign tasks to each goal.  
- Each task can have a set target count to achieve, and chosen days to mark progress. User can also be reminded of the task assigned on a day (on a generic time e.g. morning/afternoon/evening/night).  
- The user can also progress the task on a non-assigned day or make extra progress in a day.  
- If the user has set a reminder, their will receive an email on their selected time.  
- The timings are localised to the user's timezone to avoid UTC/local logic conflicts.

## stack

- Built with Fastify/Node on the backend and Next.js for the app.  
- Components from Radix (checkout the site, it's super elegant), `dayjs` for date helpers.  
- tRPC & Zod for APIs and validation.  
- Postgres & DrizzleORM for db & queries.  
- lucia-auth for authentication.  
- GCP's Cloud Tasks for scheduled tasks.

## db schema

Schemas are modelled in DrizzleORM for typesafety (found in `models.ts`)

### users

| id     | name | email | p_hash | created_at |
| ------ | ---- | ----- | ------ | ---------- |
| serial | text | text  | text   | timestamp  |

### sessions

| id   | uid     | expires_at |
| ---- | ------- | ---------- |
| text | integer | timestamp  |

Used by lucia-auth

### goals

| id     | uid  | achieve_till | title | status | created_at | updated_at |
| ------ | ---- | ------------ | ----- | ------ | ---------- | ---------- |
| serial | text | timestamp    | text  | text   | timestamp  | timestamp  |

`status` is stored as a text column, but it is enum-ified by Zod

### tasks

| id     | goal_id | count   | count_to_achieve | schedule | should_remind | next_reminder_at | title | enqueued_task_id | updated_at | created_at |
| ------ | ------- | ------- | ---------------- | -------- | ------------- | ---------------- | ----- | ---------------- | ---------- | ---------- |
| serial | integer | integer | integer          | jsonb    | boolean       | timestamp        | text  | text             | timestamp  | timestamp  |

- `next_reminder_at` will always keep track of a task's upcoming reminder
  - in case of a failure, a cron can pickup the previous pending reminders which couldn't be sent and re-trigger them.
- `enqueued_task_id` is the upcoming reminder's cloud task ID
- cloud tasks are triggered to an endpoint on the server, which acts like a webhook and invokes nodemailer.
- `schedule` is a structured json which follows this zod schema

```js
{
  days: z.number().min(-1).max(6).array().length(7) /** array of days from SUN to SAT. if a day is unassigned, its value will be -1. */,
  timesPerDay: z.number(),
  remindAtHours: z.number(/** hour of the day, supports multiple reminders */).array(),
  tzHoursOffset: z.number(),
}
```

### task_logs

| id     | task_id | count_before_action | created_at |
| ------ | ------- | ------------------- | ---------- |
| serial | integer | integer             | timestamp  |

Acts as an append only table, keeps track of user's progress

## architecture

- A simple client-server pattern, with an external job scheduler (Cloud Task).  
- tRPC is used for ease of development and `superjson` for serializing prominent objects: Dates/Maps etc.
- Signup/login/sessions are handled by `lucia-auth` and are persisted on Postgres
- Both `app` and `server` are simple Node apps.  
- The stack is currently hosted on Render's free instances (could have >50s cold start)

## the demo
https://github.com/Suraj-Gov/guri/assets/53397213/6d54df06-d53c-4070-bafd-5524662994df

