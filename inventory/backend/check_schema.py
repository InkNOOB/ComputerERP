from database import get_db_connection

def check_schema():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    table_name,
                    column_name,
                    data_type,
                    is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY table_name, ordinal_position;
            """)

            rows = cur.fetchall()

            for row in rows:
                print(row)

def check_relationships():
    with get_db_connection() as conn:
        with conn.cursor() as cur:

            print("\n========== FOREIGN KEYS ==========")

            cur.execute("""
                SELECT
                    conrelid::regclass AS table_name,
                    conname AS constraint_name,
                    pg_get_constraintdef(oid) AS relationship
                FROM pg_constraint
                WHERE contype = 'f'
                AND connamespace = 'public'::regnamespace
                ORDER BY conrelid::regclass::text;
            """)

            for row in cur.fetchall():
                print(row)

            print("\n========== CHECK CONSTRAINTS ==========")

            cur.execute("""
                SELECT
                    conrelid::regclass AS table_name,
                    conname AS constraint_name,
                    pg_get_constraintdef(oid) AS allowed_values
                FROM pg_constraint
                WHERE contype = 'c'
                AND connamespace = 'public'::regnamespace
                ORDER BY conrelid::regclass::text;
            """)

            for row in cur.fetchall():
                print(row)

def check_existing_statuses():
    with get_db_connection() as conn:
        with conn.cursor() as cur:

            checks = [
                ('RestockRequest', 'status', '"RestockRequest"'),
                ('PurchaseRequest', 'Status', '"PurchaseRequest"'),
                ('PRODUCTION', 'status', '"PRODUCTION"'),
                ('sales_order', 'status', 'sales_order'),
                ('delivery', 'status', 'delivery'),
                ('GoodsReceived', 'ItemCondition', '"GoodsReceived"'),
                ('ITEM_MASTER', 'ItemType', '"ITEM_MASTER"')
            ]

            print("\n========== EXISTING STATUS VALUES ==========")

            for table, column, table_name in checks:
                cur.execute(
                    f"SELECT DISTINCT \"{column}\" "
                    f"FROM {table_name} "
                    f"ORDER BY \"{column}\";"
                )

                print(f"\n{table}.{column}")

                for row in cur.fetchall():
                    print(row)


def check_order_records():
    checks = [
        (
            "RESTOCK REQUESTS",
            'SELECT "RR_ID", "IM_ID", "WH_ID", "Quantity", "status" '
            'FROM "RestockRequest" ORDER BY "RR_ID" DESC LIMIT 10'
        ),
        (
            "PURCHASE REQUESTS",
            'SELECT "PR_ID", "RestockRequestID", "Status" '
            'FROM "PurchaseRequest" ORDER BY "PR_ID" DESC LIMIT 10'
        ),
        (
            "REQUEST QUOTATIONS",
            'SELECT "RFQ_ID", "PR_ID", "SupplierID" '
            'FROM "RequestQuotation" ORDER BY "RFQ_ID" DESC LIMIT 10'
        ),
        (
            "PURCHASE ORDERS",
            'SELECT "PO_ID", "RFQ_ID", "OrderDate" '
            'FROM "PurchaseOrder" ORDER BY "PO_ID" DESC LIMIT 10'
        ),
        (
            "GOODS RECEIVED",
            'SELECT "GR_ID", "PO_ID", "ItemCondition", '
            '"QuantityReceived", "Remarks" '
            'FROM "GoodsReceived" ORDER BY "GR_ID" DESC LIMIT 10'
        ),
        (
            "PRODUCTION",
            'SELECT "Production_ID", "PM_ID", "WH_ID", '
            '"QuantityRequired", "QuantityProduced", "status", "RR_ID" '
            'FROM "PRODUCTION" ORDER BY "Production_ID" DESC LIMIT 10'
        ),
        (
            "SALES ORDERS",
            'SELECT order_id, order_date, total_amount, status '
            'FROM sales_order ORDER BY order_id DESC LIMIT 10'
        ),
        (
            "SALES ORDER DETAILS",
            'SELECT order_detail_id, order_id, "IM_ID", quantity '
            'FROM sales_order_detail '
            'ORDER BY order_detail_id DESC LIMIT 10'
        ),
        (
            "DELIVERIES",
            'SELECT delivery_id, order_id, "WH_ID", delivery_date, status '
            'FROM delivery ORDER BY delivery_id DESC LIMIT 10'
        )
    ]

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            for title, query in checks:
                print(f"\n========== {title} ==========")
                cur.execute(query)

                rows = cur.fetchall()

                if not rows:
                    print("No records found.")

                for row in rows:
                    print(row)


def check_order_details():
    queries = [
        (
            "PROCUREMENT DETAILS",
            """
            SELECT
                rr."RR_ID",
                im."Item_Name",
                im."ItemType",
                w."Warehouse_Name",
                rr."Quantity",
                s."SupplierName",
                po."PO_ID",
                gr."QuantityReceived",
                gr."ItemCondition",
                gr."Remarks"
            FROM "RestockRequest" rr
            JOIN "ITEM_MASTER" im ON im."IM_ID" = rr."IM_ID"
            JOIN "WAREHOUSE" w ON w."WH_ID" = rr."WH_ID"
            LEFT JOIN "PurchaseRequest" pr
                ON pr."RestockRequestID" = rr."RR_ID"
            LEFT JOIN "RequestQuotation" rq
                ON rq."PR_ID" = pr."PR_ID"
            LEFT JOIN "Supplier" s
                ON s."SupplierID" = rq."SupplierID"
            LEFT JOIN "PurchaseOrder" po
                ON po."RFQ_ID" = rq."RFQ_ID"
            LEFT JOIN "GoodsReceived" gr
                ON gr."PO_ID" = po."PO_ID"
            ORDER BY rr."RR_ID";
            """
        ),
        (
            "PRODUCTION PRODUCT DETAILS",
            """
            SELECT
                p."Production_ID",
                pm."PM_ID",
                im."Item_Name",
                im."ItemType",
                p."QuantityRequired",
                p."QuantityProduced",
                p."status",
                w."Warehouse_Name"
            FROM "PRODUCTION" p
            JOIN "PRODUCT_MASTER" pm ON pm."PM_ID" = p."PM_ID"
            JOIN "ITEM_MASTER" im ON im."IM_ID" = pm."IM_ID"
            JOIN "WAREHOUSE" w ON w."WH_ID" = p."WH_ID"
            ORDER BY p."Production_ID";
            """
        ),
        (
            "BILL OF MATERIALS",
            """
            SELECT
                pm."PM_ID",
                product."Item_Name" AS product_name,
                material."IM_ID" AS material_id,
                material."Item_Name" AS material_name,
                bom."MaterialRequired"
            FROM "BILL_OF_MATERIALS" bom
            JOIN "PRODUCT_MASTER" pm ON pm."PM_ID" = bom."PM_ID"
            JOIN "ITEM_MASTER" product ON product."IM_ID" = pm."IM_ID"
            JOIN "ITEM_MASTER" material ON material."IM_ID" = bom."IM_ID"
            ORDER BY pm."PM_ID", material."IM_ID";
            """
        ),
        (
            "SALES ORDER DETAILS",
            """
            SELECT
                so.order_id,
                so.order_date,
                c.name AS customer_name,
                im."IM_ID",
                im."Item_Name",
                im."ItemType",
                sod.quantity,
                so.status
            FROM sales_order so
            JOIN customers c ON c.customer_id = so.customer_id
            JOIN sales_order_detail sod ON sod.order_id = so.order_id
            JOIN "ITEM_MASTER" im ON im."IM_ID" = sod."IM_ID"
            ORDER BY so.order_id;
            """
        )
    ]

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            for title, query in queries:
                print(f"\n========== {title} ==========")
                cur.execute(query)

                rows = cur.fetchall()

                if not rows:
                    print("No records found.")

                for row in rows:
                    print(row)



if __name__ == "__main__":
    check_schema()
    check_relationships()
    check_existing_statuses()
    check_order_records()
    check_order_details()