import sys
import frappe

from bbl_api.utils import * 

sys.argv = ['calculator.py', '--sum', '1', '2', '3']

print_red("I'am bbl_app/test_app.py")
from pprint import pprint, pformat


def create_events():
    if frappe.flags.test_events_created:
        return

    frappe.set_user("Administrator")
    doc = frappe.get_doc({
        "doctype": "Event",
        "subject":"_Test Event 1",
        "starts_on": "2014-01-01",
        "event_type": "Public"
    }).insert()

    pprint(doc.as_dict())

    doc = frappe.get_doc({
        "doctype": "Event",
        "subject":"_Test Event 3",
        "starts_on": "2014-01-01",
        "event_type": "Public",
        "event_individuals": [{
            "person": "test1@example.com"
        }]
    }).insert()
    print_green(pformat(doc.as_dict()))

    frappe.flags.test_events_created = True

# bench run-tests --module bbl_app.bbl_app.test_app
create_events()





""" # run all tests 测试命令说明
bench --site [sitename] run-tests

# run tests for only frappe app
bench --site [sitename] run-tests --app frappe

# run tests for the Task doctype
bench --site [sitename] run-tests --doctype "Task"

# run tests for All doctypes in specified Module Def
bench --site [sitename] run-tests --module-def "Contacts"

# run a test using module path
bench --site [sitename] run-tests --module frappe.tests.test_api

# run a specific test from a test file
bench --site [sitename] run-tests --module frappe.tests.test_api --test test_insert_many

# run tests without creating test records
bench --site [sitename] run-tests --skip-test-records --doctype "Task"

# profile tests and show a report after tests execute
bench --site [sitename] run-tests --profile --doctype "Task"

# verbose log level for tests
bench --site [sitename] --verbose run-tests
 """