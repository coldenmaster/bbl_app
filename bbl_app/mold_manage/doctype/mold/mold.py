# Copyright (c) 2024, bbl and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

from bbl_api.utils import print_blue, print_green, print_red


class Mold(Document):
	
    ''' 以下是回调执行顺序 '''
    # 新建才有此回调
    def before_insert(self):
        print_green('Mold before insert')

    def before_validate(self):
        print_green('Mold before validate')
        self.calc_status_from_children()
        # return True

    def validate(self):
        print_green('validate')

    def before_save(self):
        print_green('Mold before before_save')
                

    def db_update(self):
        print_green('custom db_update')
        super().db_update()

    def on_update(self):
        print_green('on update')

    def on_change(self):
        print_green('on change')


    def calc_status_from_children(self):
        # print_red('calc_status_from_children')
        # print_green(self.as_dict())
        children = self.table_fsrf
        if (not children):
            return
        # children.reverse()
        child = children[-1]
        self.mold_status = child.mold_status
        # self.repairTimes = 3

        # 最后一条没有产量，不进行 status 更新
        if (not child.product_quantity):
            return
        
        quantitys = [item.product_quantity for item in children]
        self.total_output = sum(quantitys)

        cycle = child.record_cycle
        self.batch_cycle = cycle

        batch_quantity = [
            item.product_quantity for item in children 
            if item.record_cycle == cycle
        ]
        self.batch_output = sum(batch_quantity)
        print_blue(self.as_dict())

    # def fetch_from_linked_technology(self):        
    #     pass

    # 以下事件还没有验证

    # def before_naming(self):
    #     print_red('Mold before naming')

    # def before_submit(self):
    #     print_red('Mold before submit')
                
    # def before_cancel(self):
    #     print_red('Mold before cancel')
                
    # def before_update_after_submit(self):
    #     print_red('Mold before update_after_submit')
                
    # def db_insert(self, ignore_if_duplicate=False):
    #     print_red('db_insert')
    #     super().db_insert()

    # def after_insert(self):
    #     print_red('after_insert')

    # def on_submit(self):
    #     print_red('on submit')

    # def on_cancel(self):
    #     print_red('on cancel')

    # def on_update_after_submit(self):
    #     print_red('on update after submit')


    # def on_trash(self):
    #     print_red('on trash')

    # def after_delete(self):
    #     print_red('after delete')

    # def before_rename(self):
    #     print_red('before rename')

    # def after_rename(self):
    #     print_red('after rename')



