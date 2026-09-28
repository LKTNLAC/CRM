from pydantic import BaseModel


class PageMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int


class PageParams(BaseModel):
    page: int = 1
    page_size: int = 20
    sort: str | None = None

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size