# 原钢长度质量换算: mm, mm to kg
def raw_leng_to_weight(dia, length, density=7.9):
    dia = int(dia)
    length = int(length)
    if not dia or not length :
        return 0
    volume = dia * dia * 3.1415926 / 4 * length
    weight = volume * density / 1000 / 1000
    return weight