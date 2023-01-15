select *
from (
        select *,
            row_number() over (partition by SECURITY) as RowNbr
        from tda_daily_flow
    ) source
where RowNbr = 1