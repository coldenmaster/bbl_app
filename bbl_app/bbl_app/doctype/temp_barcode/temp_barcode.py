# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from bbl_api.utils import print_red


class TempBarcode(Document):
	pass

# http://dev2.localhost:8000/api/method/bbl_app.bbl_app.doctype.temp_barcode.temp_barcode.sendup_barcode?scan_barcode=123
@frappe.whitelist(allow_guest=True)
def sendup_barcode(**kwargs):
    print_red(kwargs)
    kwargs["doctype"] = "Temp Barcode"
    new_doc = frappe.get_doc(kwargs)
    new_doc.insert()
    frappe.db.commit()
    return "ok"