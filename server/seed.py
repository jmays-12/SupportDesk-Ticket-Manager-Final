import random
from datetime import datetime, timedelta, timezone

from app import app, db, bcrypt
from models import User, Customer, Ticket, TicketNote

# Uncomment for reproducible seed data (same "random" dates every run):
# random.seed(111)


LOREM_SHORT = (
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
)

LOREM_MEDIUM = (
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque "
    "faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi "
    "pretium tellus duis convallis. Tempus leo eu aenean sed diam urna "
    "tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. "
    "Iaculis massa nisl malesuada lacinia integer nunc posuere."
)

LOREM_LONG = (
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque "
    "faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi "
    "pretium tellus duis convallis. Tempus leo eu aenean sed diam urna "
    "tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. "
    "Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit "
    "semper vel class aptent taciti sociosqu. Ad litora torquent per conubia "
    "nostra inceptos himenaeos. Curabitur sodales ligula in libero. Sed "
    "dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean "
    "quam. In sem justo, commodo ut, suscipit at, pharetra vitae, orci. "
    "Fusce feugiat. Phasellus ultrices nulla quis nibh. Quisque a lectus. "
    "Donec consectetuer ligula vulputate sem tristique cursus. Nam nulla "
    "quam, gravida non, commodo a, sodales sit amet, nisi. Pellentesque "
    "fermentum dolor sit amet leo."
)

LOREM_XLONG = LOREM_LONG + " " + (
    "Aliquam erat volutpat. Vivamus elementum semper nisi. Aenean vulputate "
    "eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, "
    "eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, "
    "feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. "
    "Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. "
    "Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. "
    "Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper "
    "libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, "
    "blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio "
    "et ante tincidunt tempus. Donec vitae sapien ut libero venenatis "
    "faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus "
    "tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales "
    "sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit "
    "cursus nunc."
)


def random_ticket_date(status):
    """
    Pick a realistic created_at for a ticket based on its status:
    resolved tickets skew older (they've had time to get resolved),
    in-progress tickets are moderately recent, and open tickets skew
    toward the last couple of weeks. Without this, every ticket in the
    seed data would get the exact same "now" timestamp.
    """
    now = datetime.now(timezone.utc)

    if status == "resolved":
        days_ago = random.uniform(14, 120)
    elif status == "in_progress":
        days_ago = random.uniform(3, 30)
    else:  # open
        days_ago = random.uniform(0, 14)

    return now - timedelta(
        days=days_ago,
        hours=random.uniform(0, 23),
        minutes=random.uniform(0, 59),
    )


def random_note_dates(start_dt, count, max_gap_days=5):
    """
    Generate `count` created_at timestamps for notes on the same ticket.
    Each one lands after the previous timestamp (and after the ticket's
    own created_at), and never past "now" - so notes always look like
    they happened after the ticket was opened, in order.
    """
    now = datetime.now(timezone.utc)
    dates = []
    cursor = start_dt

    for _ in range(count):
        upper_bound = min(now, cursor + timedelta(days=max_gap_days))
        if upper_bound <= cursor:
            cursor = now
        else:
            gap_seconds = random.uniform(3600, (upper_bound - cursor).total_seconds())
            cursor = cursor + timedelta(seconds=gap_seconds)
        dates.append(cursor)

    return dates


def seed_database():
    with app.app_context():
        print("Clearing existing data...")

        # Delete in dependency order.
        # Notes reference tickets and users, so they must be deleted first.
        TicketNote.query.delete()
        Ticket.query.delete()
        Customer.query.delete()
        User.query.delete()

        db.session.commit()

        print("Creating users...")

        password_hash = bcrypt.generate_password_hash("test").decode("utf-8")

        test_user = User(
            name="Test User",
            email="test@test.com",
            password_hash=password_hash
        )

        admin = User(
            name="Admin User",
            email="admin@supportdesk.com",
            password_hash=password_hash
        )

        db.session.add_all([test_user, admin])
        db.session.commit()

        print("Creating customers...")

        customers = [
            Customer(name="Bob Smith", email="customer1@example.com", phone_number="555-010-0001"),
            Customer(name="Alice Bennett", email="customer2@example.com", phone_number="555-010-0002"),
            Customer(name="Riley Parker", email="customer3@example.com", phone_number="555-010-0003"),
            Customer(name="Jamie Collins", email="customer4@example.com", phone_number=None),
            Customer(name="Reginald Lee", email="customer5@example.com", phone_number="555-010-0005"),
            Customer(name="Phil Debe", email="customer6@example.com", phone_number=None),
        ]

        db.session.add_all(customers)
        db.session.commit()

        print("Creating tickets...")

        # Each ticket is annotated with what it's designed to exercise.
        tickets = [
            # ---- Priority × Status coverage -------------------------------------
            Ticket(
                subject="Test Ticket: Critical + Open + Assigned",
                description=LOREM_LONG,
                status="open",
                priority="critical",
                created_at=random_ticket_date("open"),
                customer_id=customers[0].id,
                assigned_user_id=admin.id,
            ),
            Ticket(
                subject="Test Ticket: Critical + In Progress + Assigned",
                description=LOREM_LONG,
                status="in_progress",
                priority="critical",
                created_at=random_ticket_date("in_progress"),
                customer_id=customers[1].id,
                assigned_user_id=test_user.id,
            ),
            Ticket(
                subject="Test Ticket: Critical + Resolved + Assigned",
                description=LOREM_MEDIUM,
                status="resolved",
                priority="critical",
                created_at=random_ticket_date("resolved"),
                customer_id=customers[2].id,
                assigned_user_id=admin.id,
            ),
            Ticket(
                subject="Test Ticket: High + Open + Unassigned",
                description=LOREM_MEDIUM,
                status="open",
                priority="high",
                created_at=random_ticket_date("open"),
                customer_id=customers[3].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: High + In Progress + Unassigned",
                description=LOREM_SHORT,
                status="in_progress",
                priority="high",
                created_at=random_ticket_date("in_progress"),
                customer_id=customers[4].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: High + Resolved + Assigned",
                description=LOREM_MEDIUM,
                status="resolved",
                priority="high",
                created_at=random_ticket_date("resolved"),
                customer_id=customers[5].id,
                assigned_user_id=test_user.id,
            ),
            Ticket(
                subject="Test Ticket: Medium + Open + Assigned",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[0].id,
                assigned_user_id=test_user.id,
            ),
            Ticket(
                subject="Test Ticket: Medium + In Progress + Unassigned",
                description=LOREM_MEDIUM,
                status="in_progress",
                priority="medium",
                created_at=random_ticket_date("in_progress"),
                customer_id=customers[1].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Medium + Resolved + Unassigned",
                description=LOREM_SHORT,
                status="resolved",
                priority="medium",
                created_at=random_ticket_date("resolved"),
                customer_id=customers[2].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Low + Open + Unassigned",
                description=LOREM_SHORT,
                status="open",
                priority="low",
                created_at=random_ticket_date("open"),
                customer_id=customers[3].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Low + In Progress + Assigned",
                description=LOREM_SHORT,
                status="in_progress",
                priority="low",
                created_at=random_ticket_date("in_progress"),
                customer_id=customers[4].id,
                assigned_user_id=admin.id,
            ),
            Ticket(
                subject="Test Ticket: Low + Resolved + Assigned",
                description=LOREM_SHORT,
                status="resolved",
                priority="low",
                created_at=random_ticket_date("resolved"),
                customer_id=customers[5].id,
                assigned_user_id=test_user.id,
            ),

            # ---- Extreme description lengths ------------------------------------
            Ticket(
                subject="Test Ticket: Very long description (XL)",
                description=LOREM_XLONG,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[0].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Very long subject — " + ("Lorem ipsum dolor sit amet " * 6).strip(),
                description=LOREM_MEDIUM,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[1].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Single-word description",
                description="Placeholder.",
                status="open",
                priority="low",
                created_at=random_ticket_date("open"),
                customer_id=customers[2].id,
                assigned_user_id=None,
            ),

            # ---- Pagination fillers ---------------------------------------------
            # 10 total "Pagination filler" tickets so page 1, 2, and 3 all fill
            # under the default page size of 10.
            Ticket(
                subject="Test Ticket: Pagination filler 1",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[0].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 2",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[0].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 3",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[1].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 4",
                description=LOREM_SHORT,
                status="open",
                priority="low",
                created_at=random_ticket_date("open"),
                customer_id=customers[1].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 5",
                description=LOREM_SHORT,
                status="open",
                priority="low",
                created_at=random_ticket_date("open"),
                customer_id=customers[2].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 6",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[2].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 7",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[3].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 8",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[3].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 9",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[4].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 10",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                created_at=random_ticket_date("open"),
                customer_id=customers[4].id,
                assigned_user_id=None,
            ),

            # ---- Sort coverage --------------------------------------------------
            # Mix of older and newer created_at values will occur naturally
            # because we insert in order. These are intentionally scattered
            # across priorities and statuses to make "sort by priority" and
            # "sort by status" visually distinct.
            Ticket(
                subject="Test Ticket: Sort check — critical, should float to top",
                description=LOREM_SHORT,
                status="open",
                priority="critical",
                created_at=random_ticket_date("open"),
                customer_id=customers[5].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Sort check — low, should sink to bottom",
                description=LOREM_SHORT,
                status="in_progress",
                priority="low",
                created_at=random_ticket_date("in_progress"),
                customer_id=customers[5].id,
                assigned_user_id=None,
            ),

            # ---- Multi-ticket customers -----------------------------------------
            # Customer 1 already appears on several tickets; add a couple more
            # so "customer with many tickets" is testable when we add filtering.
            Ticket(
                subject="Test Ticket: Customer 1 has many tickets (A)",
                description=LOREM_SHORT,
                status="open",
                priority="high",
                created_at=random_ticket_date("open"),
                customer_id=customers[0].id,
                assigned_user_id=admin.id,
            ),
            Ticket(
                subject="Test Ticket: Customer 1 has many tickets (B)",
                description=LOREM_SHORT,
                status="in_progress",
                priority="medium",
                created_at=random_ticket_date("in_progress"),
                customer_id=customers[0].id,
                assigned_user_id=test_user.id,
            ),

            # ---- Empty / minimal tickets ----------------------------------------
            Ticket(
                subject="Test Ticket: Minimal — no notes, no assignee",
                description="Placeholder description.",
                status="open",
                priority="low",
                created_at=random_ticket_date("open"),
                customer_id=customers[5].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Resolved with no notes",
                description="Placeholder description.",
                status="resolved",
                priority="low",
                created_at=random_ticket_date("resolved"),
                customer_id=customers[4].id,
                assigned_user_id=None,
            ),
        ]

        db.session.add_all(tickets)
        db.session.commit()

        print("Creating ticket notes...")

        # Notes are annotated so you can see what each one is testing.
        #
        # Ticket 0  (Critical/Open/Assigned)   → 4 notes, mixed authors, includes XL note
        # Ticket 1  (Critical/InProgress)      → 2 notes
        # Ticket 2  (Critical/Resolved)        → 1 note
        # Ticket 3  (High/Open/Unassigned)     → 0 notes
        # Ticket 4  (High/InProgress)          → 1 note
        # Ticket 5  (High/Resolved)            → 2 notes
        # Ticket 6  (Medium/Open)              → 0 notes
        # Ticket 7  (Medium/InProgress)        → 1 note
        # Ticket 8  (Medium/Resolved)          → 1 note
        # Ticket 9  (Low/Open)                 → 0 notes
        # Ticket 10 (Low/InProgress)           → 1 note
        # Ticket 11 (Low/Resolved)             → 0 notes
        # Ticket 12 (Very long description)    → 2 notes, one XL
        # Ticket 13 (Very long subject)        → 1 note
        # Ticket 14 (Single-word description)  → 0 notes
        # Tickets 15–24 (Pagination fillers)   → 1 note each on 15 and 20, 0 on the rest
        # Ticket 25 (Sort check critical)      → 1 note
        # Ticket 26 (Sort check low)           → 0 notes
        # Ticket 27 (Customer 1 many A)        → 1 note
        # Ticket 28 (Customer 1 many B)        → 0 notes
        # Ticket 29 (Minimal)                  → 0 notes
        # Ticket 30 (Resolved no notes)        → 0 notes
        #
        # (Two extra tickets beyond the plan for slack.)

        # generate note timestamps per ticket, seeded from each ticket's own
        # created_at, so notes always land chronologically after their ticket
        t0_dates = random_note_dates(tickets[0].created_at, 4)
        t1_dates = random_note_dates(tickets[1].created_at, 2)
        t2_dates = random_note_dates(tickets[2].created_at, 1)
        t4_dates = random_note_dates(tickets[4].created_at, 1)
        t5_dates = random_note_dates(tickets[5].created_at, 2)
        t7_dates = random_note_dates(tickets[7].created_at, 1)
        t8_dates = random_note_dates(tickets[8].created_at, 1)
        t10_dates = random_note_dates(tickets[10].created_at, 1)
        t12_dates = random_note_dates(tickets[12].created_at, 2)
        t13_dates = random_note_dates(tickets[13].created_at, 1)
        t15_dates = random_note_dates(tickets[15].created_at, 1)
        t20_dates = random_note_dates(tickets[20].created_at, 1)
        t25_dates = random_note_dates(tickets[25].created_at, 1)
        t27_dates = random_note_dates(tickets[27].created_at, 1)

        notes = [
            # Ticket 0: 4 notes, mixed authors, XL on the last
            TicketNote(ticket_id=tickets[0].id, user_id=admin.id,
                       content="Placeholder note: initial triage complete.",
                       created_at=t0_dates[0]),
            TicketNote(ticket_id=tickets[0].id, user_id=test_user.id,
                       content="Placeholder note: reproduced the issue locally.",
                       created_at=t0_dates[1]),
            TicketNote(ticket_id=tickets[0].id, user_id=admin.id,
                       content=LOREM_MEDIUM,
                       created_at=t0_dates[2]),
            TicketNote(ticket_id=tickets[0].id, user_id=test_user.id,
                       content=LOREM_XLONG,
                       created_at=t0_dates[3]),

            # Ticket 1: 2 notes
            TicketNote(ticket_id=tickets[1].id, user_id=admin.id,
                       content="Placeholder note: awaiting customer response.",
                       created_at=t1_dates[0]),
            TicketNote(ticket_id=tickets[1].id, user_id=test_user.id,
                       content=LOREM_MEDIUM,
                       created_at=t1_dates[1]),

            # Ticket 2: 1 note
            TicketNote(ticket_id=tickets[2].id, user_id=admin.id,
                       content="Placeholder note: marked resolved after verification.",
                       created_at=t2_dates[0]),

            # Ticket 4: 1 note
            TicketNote(ticket_id=tickets[4].id, user_id=test_user.id,
                       content="Placeholder note: investigating.",
                       created_at=t4_dates[0]),

            # Ticket 5: 2 notes
            TicketNote(ticket_id=tickets[5].id, user_id=test_user.id,
                       content="Placeholder note: fix deployed to staging.",
                       created_at=t5_dates[0]),
            TicketNote(ticket_id=tickets[5].id, user_id=admin.id,
                       content=LOREM_SHORT,
                       created_at=t5_dates[1]),

            # Ticket 7: 1 note
            TicketNote(ticket_id=tickets[7].id, user_id=admin.id,
                       content="Placeholder note: blocked on third-party vendor.",
                       created_at=t7_dates[0]),

            # Ticket 8: 1 note
            TicketNote(ticket_id=tickets[8].id, user_id=test_user.id,
                       content="Placeholder note: customer confirmed resolution.",
                       created_at=t8_dates[0]),

            # Ticket 10: 1 note
            TicketNote(ticket_id=tickets[10].id, user_id=admin.id,
                       content="Placeholder note: low priority, scheduled for next sprint.",
                       created_at=t10_dates[0]),

            # Ticket 12: 2 notes, one XL
            TicketNote(ticket_id=tickets[12].id, user_id=test_user.id,
                       content=LOREM_XLONG,
                       created_at=t12_dates[0]),
            TicketNote(ticket_id=tickets[12].id, user_id=admin.id,
                       content="Placeholder note: see full description for context.",
                       created_at=t12_dates[1]),

            # Ticket 13: 1 note
            TicketNote(ticket_id=tickets[13].id, user_id=admin.id,
                       content="Placeholder note: subject length test.",
                       created_at=t13_dates[0]),

            # Ticket 15: 1 note (first pagination filler)
            TicketNote(ticket_id=tickets[15].id, user_id=admin.id,
                       content="Placeholder note: pagination filler note.",
                       created_at=t15_dates[0]),

            # Ticket 20: 1 note (middle pagination filler)
            TicketNote(ticket_id=tickets[20].id, user_id=test_user.id,
                       content="Placeholder note: pagination filler note.",
                       created_at=t20_dates[0]),

            # Ticket 25: 1 note (sort check critical)
            TicketNote(ticket_id=tickets[25].id, user_id=admin.id,
                       content="Placeholder note: sort check.",
                       created_at=t25_dates[0]),

            # Ticket 27: 1 note (customer 1 many tickets A)
            TicketNote(ticket_id=tickets[27].id, user_id=test_user.id,
                       content="Placeholder note: multi-ticket customer.",
                       created_at=t27_dates[0]),
        ]

        db.session.add_all(notes)
        db.session.commit()

        print()
        print("====================================")
        print("    Database seeded successfully    ")
        print("====================================")
        print()
        print("Test accounts:")
        print()
        print("  test@test.com")
        print("  admin@supportdesk.com")
        print()
        print("Password for ALL accounts:")
        print("test")
        print()
        print(f"Created {len(customers)} customers.")
        print(f"Created {len(tickets)} tickets.")
        print(f"Created {len(notes)} ticket notes.")
        print()
        print("Coverage:")
        print(f"  - {len(tickets)} tickets: 4 priorities x 3 statuses, assigned & unassigned")
        print("  - 1 ticket with a very long description")
        print("  - 1 ticket with a very long subject")
        print("  - 1 ticket with a single-word description")
        print("  - 10 pagination filler tickets")
        print("  - 2 sort-check tickets (critical and low)")
        print("  - Several multi-ticket customers")
        print("  - 2 tickets with no notes")
        print("  - 1 ticket with 4 notes (including a very long one)")
        print("  - created_at dates randomized and status-weighted (resolved = older, open = recent)")
        print("====================================")


if __name__ == "__main__":
    seed_database()