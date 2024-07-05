# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document

from bbl_api.utils import send_wechat_msg_product_queue

class SemiOutput(Document):

    def save(self):
        super().save()
        send_wechat_msg_product_queue(self.doc_str())

    def doc_str(self):
        doc_str = '<<半成品产量>>\n'
        doc_str += f"日期：{self.for_date}\n"\
            f"工序：{self.operation}\n"\
            f"总产量：{self.total_quantity}根\n"\
            f"班组：{self.work_group or ''}\n"\
            "------\n"
            # f"备注：{self.note or ''}\n"\
        for i, item in enumerate(self.product_list):
            doc_str += f"{i+1}. {item.semi_product_name}：{item.quantity}根 {item.production_line or ''}\n"
        doc_str += f"------\nFrom：{frappe.utils.get_fullname()}\n"
        return f"{doc_str}"