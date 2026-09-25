from app import app, db, bcrypt
from models import User, Customer, Ticket, TicketNote


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
            Customer(name="Placeholder Customer 1", email="customer1@example.com", phone_number="555-010-0001"),
            Customer(name="Placeholder Customer 2", email="customer2@example.com", phone_number="555-010-0002"),
            Customer(name="Placeholder Customer 3", email="customer3@example.com", phone_number="555-010-0003"),
            Customer(name="Placeholder Customer 4", email="customer4@example.com", phone_number=None),
            Customer(name="Placeholder Customer 5", email="customer5@example.com", phone_number="555-010-0005"),
            Customer(name="Placeholder Customer 6", email="customer6@example.com", phone_number=None),
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
                customer_id=customers[0].id,
                assigned_user_id=admin.id,
            ),
            Ticket(
                subject="Test Ticket: Critical + In Progress + Assigned",
                description=LOREM_LONG,
                status="in_progress",
                priority="critical",
                customer_id=customers[1].id,
                assigned_user_id=test_user.id,
            ),
            Ticket(
                subject="Test Ticket: Critical + Resolved + Assigned",
                description=LOREM_MEDIUM,
                status="resolved",
                priority="critical",
                customer_id=customers[2].id,
                assigned_user_id=admin.id,
            ),
            Ticket(
                subject="Test Ticket: High + Open + Unassigned",
                description=LOREM_MEDIUM,
                status="open",
                priority="high",
                customer_id=customers[3].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: High + In Progress + Unassigned",
                description=LOREM_SHORT,
                status="in_progress",
                priority="high",
                customer_id=customers[4].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: High + Resolved + Assigned",
                description=LOREM_MEDIUM,
                status="resolved",
                priority="high",
                customer_id=customers[5].id,
                assigned_user_id=test_user.id,
            ),
            Ticket(
                subject="Test Ticket: Medium + Open + Assigned",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                customer_id=customers[0].id,
                assigned_user_id=test_user.id,
            ),
            Ticket(
                subject="Test Ticket: Medium + In Progress + Unassigned",
                description=LOREM_MEDIUM,
                status="in_progress",
                priority="medium",
                customer_id=customers[1].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Medium + Resolved + Unassigned",
                description=LOREM_SHORT,
                status="resolved",
                priority="medium",
                customer_id=customers[2].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Low + Open + Unassigned",
                description=LOREM_SHORT,
                status="open",
                priority="low",
                customer_id=customers[3].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Low + In Progress + Assigned",
                description=LOREM_SHORT,
                status="in_progress",
                priority="low",
                customer_id=customers[4].id,
                assigned_user_id=admin.id,
            ),
            Ticket(
                subject="Test Ticket: Low + Resolved + Assigned",
                description=LOREM_SHORT,
                status="resolved",
                priority="low",
                customer_id=customers[5].id,
                assigned_user_id=test_user.id,
            ),

            # ---- Extreme description lengths ------------------------------------
            Ticket(
                subject="Test Ticket: Very long description (XL)",
                description=LOREM_XLONG,
                status="open",
                priority="medium",
                customer_id=customers[0].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Very long subject — " + ("Lorem ipsum dolor sit amet " * 6).strip(),
                description=LOREM_MEDIUM,
                status="open",
                priority="medium",
                customer_id=customers[1].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Single-word description",
                description="Placeholder.",
                status="open",
                priority="low",
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
                customer_id=customers[0].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 2",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                customer_id=customers[0].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 3",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                customer_id=customers[1].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 4",
                description=LOREM_SHORT,
                status="open",
                priority="low",
                customer_id=customers[1].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 5",
                description=LOREM_SHORT,
                status="open",
                priority="low",
                customer_id=customers[2].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 6",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                customer_id=customers[2].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 7",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                customer_id=customers[3].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 8",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                customer_id=customers[3].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 9",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
                customer_id=customers[4].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Pagination filler 10",
                description=LOREM_SHORT,
                status="open",
                priority="medium",
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
                customer_id=customers[5].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Sort check — low, should sink to bottom",
                description=LOREM_SHORT,
                status="in_progress",
                priority="low",
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
                customer_id=customers[0].id,
                assigned_user_id=admin.id,
            ),
            Ticket(
                subject="Test Ticket: Customer 1 has many tickets (B)",
                description=LOREM_SHORT,
                status="in_progress",
                priority="medium",
                customer_id=customers[0].id,
                assigned_user_id=test_user.id,
            ),

            # ---- Empty / minimal tickets ----------------------------------------
            Ticket(
                subject="Test Ticket: Minimal — no notes, no assignee",
                description="Placeholder description.",
                status="open",
                priority="low",
                customer_id=customers[5].id,
                assigned_user_id=None,
            ),
            Ticket(
                subject="Test Ticket: Resolved with no notes",
                description="Placeholder description.",
                status="resolved",
                priority="low",
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

        notes = [
            # Ticket 0: 4 notes, mixed authors, XL on the last
            TicketNote(ticket_id=tickets[0].id, user_id=admin.id,
                       content="Placeholder note: initial triage complete."),
            TicketNote(ticket_id=tickets[0].id, user_id=test_user.id,
                       content="Placeholder note: reproduced the issue locally."),
            TicketNote(ticket_id=tickets[0].id, user_id=admin.id,
                       content=LOREM_MEDIUM),
            TicketNote(ticket_id=tickets[0].id, user_id=test_user.id,
                       content=LOREM_XLONG),

            # Ticket 1: 2 notes
            TicketNote(ticket_id=tickets[1].id, user_id=admin.id,
                       content="Placeholder note: awaiting customer response."),
            TicketNote(ticket_id=tickets[1].id, user_id=test_user.id,
                       content=LOREM_MEDIUM),

            # Ticket 2: 1 note
            TicketNote(ticket_id=tickets[2].id, user_id=admin.id,
                       content="Placeholder note: marked resolved after verification."),

            # Ticket 4: 1 note
            TicketNote(ticket_id=tickets[4].id, user_id=test_user.id,
                       content="Placeholder note: investigating."),

            # Ticket 5: 2 notes
            TicketNote(ticket_id=tickets[5].id, user_id=test_user.id,
                       content="Placeholder note: fix deployed to staging."),
            TicketNote(ticket_id=tickets[5].id, user_id=admin.id,
                       content=LOREM_SHORT),

            # Ticket 7: 1 note
            TicketNote(ticket_id=tickets[7].id, user_id=admin.id,
                       content="Placeholder note: blocked on third-party vendor."),

            # Ticket 8: 1 note
            TicketNote(ticket_id=tickets[8].id, user_id=test_user.id,
                       content="Placeholder note: customer confirmed resolution."),

            # Ticket 10: 1 note
            TicketNote(ticket_id=tickets[10].id, user_id=admin.id,
                       content="Placeholder note: low priority, scheduled for next sprint."),

            # Ticket 12: 2 notes, one XL
            TicketNote(ticket_id=tickets[12].id, user_id=test_user.id,
                       content=LOREM_XLONG),
            TicketNote(ticket_id=tickets[12].id, user_id=admin.id,
                       content="Placeholder note: see full description for context."),

            # Ticket 13: 1 note
            TicketNote(ticket_id=tickets[13].id, user_id=admin.id,
                       content="Placeholder note: subject length test."),

            # Ticket 15: 1 note (first pagination filler)
            TicketNote(ticket_id=tickets[15].id, user_id=admin.id,
                       content="Placeholder note: pagination filler note."),

            # Ticket 20: 1 note (middle pagination filler)
            TicketNote(ticket_id=tickets[20].id, user_id=test_user.id,
                       content="Placeholder note: pagination filler note."),

            # Ticket 25: 1 note (sort check critical)
            TicketNote(ticket_id=tickets[25].id, user_id=admin.id,
                       content="Placeholder note: sort check."),

            # Ticket 27: 1 note (customer 1 many tickets A)
            TicketNote(ticket_id=tickets[27].id, user_id=test_user.id,
                       content="Placeholder note: multi-ticket customer."),
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
        print("  - 32 tickets: 4 priorities x 3 statuses, assigned & unassigned")
        print("  - 1 ticket with a very long description")
        print("  - 1 ticket with a very long subject")
        print("  - 1 ticket with a single-word description")
        print("  - 10 pagination filler tickets")
        print("  - 2 sort-check tickets (critical and low)")
        print("  - Several multi-ticket customers")
        print("  - 2 tickets with no notes")
        print("  - 1 ticket with 4 notes (including a very long one)")
        print("====================================")


if __name__ == "__main__":
    seed_database()