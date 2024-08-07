import importlib

import bbl_app.www.wt.reload
import bbl_app.machine_shop.doctype.product_scan.product_scan
import bbl_app.common.cp_qrcode
import bbl_api

from bbl_api.utils import print_yellow

# print_red("reload.py 加载")

def get_context(context):
    context.testpy = 'reload 重新加载模块'
    context.re = import_lib()


def import_lib():
    # print_red('reload 重新加载模块')
    # 先重新加载自己
    re = importlib.reload(bbl_app.www.wt.reload)
    # 加载需要调试的modules
    # re = importlib.reload(bbl_api.api01.iot_service)
    # re = importlib.reload(bbl_app.semi_product.doctype.short_raw_bar.short_raw_bar)
    # re = importlib.reload(bbl_app.overrides.over_stock_entry)
    re = importlib.reload(bbl_app.machine_shop.doctype.product_scan.product_scan)
    re = importlib.reload(bbl_app.common.cp_qrcode)
    

    # print_red("reload 重新加载模块完成：")
    re = 'Module reloaded:<br>' + str(re).replace('<', '')
    print_yellow(re)
    return re

