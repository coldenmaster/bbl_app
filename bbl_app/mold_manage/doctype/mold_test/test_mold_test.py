# Copyright (c) 2024, bbl and Contributors
# See license.txt

import frappe
from frappe.frappeclient import FrappeClient
from frappe.test_runner import make_test_objects
from frappe.tests.utils import FrappeTestCase

from frappe.monitor import MONITOR_REDIS_KEY, get_trace_id
from frappe.utils import set_request
from frappe.utils.data import get_url
from frappe.utils.response import build_response

from bbl_api.utils import _print_blue_pp, _print_green_pp, print_blue, print_blue_pp, print_green, print_green_pp, print_red, print_yellow

print_yellow("I'am test_mold_test.py")

# test_records = frappe.get_test_records("Event")
# _print_blue_pp(test_records)


class TestMoldTest(FrappeTestCase):
    def setUp(self):
        print_yellow("I'am setUp")

    def tearDown(self):
        print_yellow("I'am tearDown")

    PASSWORD = frappe.conf.admin_password or "adminb"

    def test_insert_many(self):
        server = FrappeClient(get_url(), "Administrator", self.PASSWORD, verify=False)
        # server.insert_many(
        #     [
        #         {"doctype": "Note", "title": "Sing"},
        #         {"doctype": "Note", "title": "a"},
        #         {"doctype": "Note", "title": "song"},
        #         {"doctype": "Note", "title": "of"},
        #         {"doctype": "Note", "title": "sixpence"},
        #     ]
        # )
        records = server.get_list("Note", fields=["title"])
        _print_blue_pp(records)
        records = [r.get("title") for r in records]
        _print_blue_pp(records)
        _print_green_pp(server)



