from app import app, db, bcrypt
from models import User, Customer, Ticket, TicketNote


def seed_database():
    with app.app_context():
        print("Clearing existing data...")

        # Delete in dependency order
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

        db.session.add_all([
            test_user,
            admin
        ])

        db.session.commit()

        print("Creating customers...")

        customer1 = Customer(
            name="John Smith",
            email="JSmith@example.com"
        )

        customer2 = Customer(
            name="Emily Davis",
            email="edavis@customer.com"
        )

        customer3 = Customer(
            name="Michael Brown",
            email="michael@example.com"
        )

        customer4 = Customer(
            name="Jessica Wilson",
            email="jessicaw@email.com"
        )

        customer5 = Customer(
            name="Robert Taylor",
            email="robert_taylor@test.com"
        )

        db.session.add_all([
            customer1,
            customer2,
            customer3,
            customer4,
            customer5
        ])

        db.session.commit()

        print("Creating tickets...")

        tickets = [
            Ticket(
                subject="URGENT: Critical priority ticket",
                description="Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.",
                status="open",
                priority="critical",
                customer_id=customer1.id,
                assigned_user_id=admin.id
            ),

            Ticket(
                subject="Cannot log into my account",
                description="I am entering the correct password, but I keep getting an invalid password message.",
                status="open",
                priority="high",
                customer_id=customer2.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="Website is slow",
                description="The dashboard is very slow to respond",
                status="in_progress",
                priority="high",
                customer_id=customer3.id,
                assigned_user_id=admin.id
            ),

            Ticket(
                subject="Billing question",
                description="I have a question about the charge on an invoice",
                status="in_progress",
                priority="medium",
                customer_id=customer4.id,
                assigned_user_id=test_user.id
            ),

            Ticket(
                subject="How do I change my email?",
                description="I need to update my email address",
                status="resolved",
                priority="low",
                customer_id=customer5.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="Password reset request",
                description="Customer requested assistance resetting their password",
                status="in_progress",
                priority="medium",
                customer_id=customer1.id,
                assigned_user_id=test_user.id
            ),

            Ticket(
                subject="Unable to upload attachment",
                description="The customer receives an error when attempting to upload a PDF attachment",
                status="open",
                priority="critical",
                customer_id=customer2.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="Incorrect account information",
                description="Customer reports that their account information is displaying incorrectly",
                status="open",
                priority="low",
                customer_id=customer3.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="A Support Ticket",
                description="Customer says website has too many empty tickets for testing purposes",
                status="open",
                priority="low",
                customer_id=customer3.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="A Support Ticket",
                description="Test ticket to show pagination",
                status="open",
                priority="medium",
                customer_id=customer2.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="A Support Ticket",
                description="Test ticket to show pagination",
                status="open",
                priority="medium",
                customer_id=customer2.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="A Support Ticket",
                description="Test ticket to show pagination",
                status="open",
                priority="medium",
                customer_id=customer2.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="A Support Ticket",
                description="Test ticket to show pagination",
                status="open",
                priority="medium",
                customer_id=customer2.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="A Support Ticket",
                description="Test ticket to show pagination",
                status="open",
                priority="medium",
                customer_id=customer3.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="A Support Ticket",
                description="Test ticket to show pagination",
                status="open",
                priority="low",
                customer_id=customer1.id,
                assigned_user_id=None
            ),

            Ticket(
                subject="A Support Ticket",
                description="Test ticket to show pagination",
                status="open",
                priority="medium",
                customer_id=customer1.id,
                assigned_user_id=None
            ),
        ]

        db.session.add_all(tickets)
        db.session.commit()

        print("Creating ticket notes...")

        notes = [
            TicketNote(
                ticket_id=tickets[0].id,
                user_id=admin.id,
                content="This issue is affecting the entire team"
            ),

            TicketNote(
                ticket_id=tickets[0].id,
                user_id=test_user.id,
                content="Confirmed that multiple users are experiencing the same issue."
            ),

            TicketNote(
                ticket_id=tickets[1].id,
                user_id=test_user.id,
                content="Customer reports that the password reset link did not resolve the issue."
            ),

            TicketNote(
                ticket_id=tickets[2].id,
                user_id=admin.id,
                content="Looking into server performance and recent deployments."
            ),

            TicketNote(
                ticket_id=tickets[3].id,
                user_id=test_user.id,
                content="Reviewing the customer's invoice and billing history."
            ),

            TicketNote(
                ticket_id=tickets[4].id,
                user_id=admin.id,
                content="Customer was provided instructions for updating their email address."
            ),

            TicketNote(
                ticket_id=tickets[5].id,
                user_id=test_user.id,
                content="Password reset instructions have been sent to the customer."
            ),

            TicketNote(
                ticket_id=tickets[6].id,
                user_id=admin.id,
                content="Checking the attachment upload requirements and file size limits."
            ),
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
        print(f"Created {len(tickets)} tickets.")
        print(f"Created {len(notes)} ticket notes.")
        print("Includes critical, high, medium, and low priority tickets.")
        print("====================================")


if __name__ == "__main__":
    seed_database()