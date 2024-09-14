from datetime import date


def date_slug(date, digit=4):
    return date.strftime("%Y%m%d")[-digit:]

def semi_name_slug(semi, digit=16):
    return semi.replace(" ", "").replace("-", "").upper()[-digit:]

def make_semi_stage_name(semi, digit, stage_name):
    return semi_name_slug(semi)[-digit:] + "_" + stage_name

def make_semi_batch_no_name(semi, prefix, heat_no):
    return prefix + '-' + date_slug(date.today()) + '-' +  semi_name_slug(semi, 6) + '-' + heat_no[-10:]


if __name__ == "__main__":
    # print(date_slug(date.today()))
    # print(date.today().strftime("%Y%m%d")[-4:])
    # print(date.today().strftime("%Y%m%d")[-4])
    print(make_semi_stage_name("65230-116", 6, "短棒料"))
    print(make_semi_batch_no_name("BBL-SEMI-a", "DBL", "V22101561"))