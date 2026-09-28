class InvalidCredentials(Exception):
    pass


class TokenReuseDetected(Exception):
    pass


class AccountLocked(Exception):
    pass