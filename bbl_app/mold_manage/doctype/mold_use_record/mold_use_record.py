# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class MoldUseRecord(Document):
	'''
        子表没有进行事件回调，以下函数监控不到
    '''
    # def before_validate(self):
    #     print_green('MoldUseRecord before validate')
    #     print_green(self.as_dict())

    # def validate(self):
    #     print_green('22 validate')
        
    # def on_update(self):
    #     print_green('33 on update')

    # def on_change(self):
    #     print_green('44 on change')
        
    # def before_insert(self):
    #     print_green('55 before insert')
    #     parent_doc = self.get_parent()

