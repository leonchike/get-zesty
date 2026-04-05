import requests
from tabulate import tabulate
import re


def clean_product_name(name):
    # Remove brand names and extra information in parentheses
    return re.sub(r'\([^)]*\)', '', name).split(',')[0].strip()


def categorize_product(categories):
    if any(category in categories for category in ['Fruits', 'Vegetables', 'Fresh foods']):
        return 'Fresh Produce'
    elif any(category in categories for category in ['Dairy', 'Milk', 'Eggs']):
        return 'Dairy & Eggs'
    elif any(category in categories for category in ['Meats', 'Seafood', 'Fish']):
        return 'Meat & Seafood'
    elif any(category in categories for category in ['Breads', 'Bakery']):
        return 'Bakery & Bread'
    elif any(category in categories for category in ['Frozen foods']):
        return 'Frozen'
    elif any(category in categories for category in ['Beverages', 'Drinks']):
        return 'Beverages'
    elif any(category in categories for category in ['Snacks', 'Chips', 'Crackers']):
        return 'Snacks'
    else:
        return 'Pantry'


def fetch_products(page=100, page_size=100):
    url = "https://world.openfoodfacts.org/cgi/search.pl"
    params = {
        'action': 'process',
        'sort_by': 'unique_scans_n',
        'page_size': page_size,
        'page': page,
        'json': 1,
        'tagtype_0': 'languages',
        'tag_contains_0': 'contains',
        'tag_0': 'en',
        'tagtype_1': 'countries',
        'tag_contains_1': 'contains',
        'tag_1': 'united-states'  # You can add more English-speaking countries here
    }
    response = requests.get(url, params=params)
    return response.json()['products']


def main():
    products = fetch_products()
    table_data = []

    for product in products:
        if 'product_name' in product and product['product_name']:
            name = clean_product_name(product['product_name'])
            categories = product.get('categories', '').split(',')
            section = categorize_product(categories)
            table_data.append([name, section])

    print(tabulate(table_data, headers=[
          'Product Name', 'Section'], tablefmt='grid'))
    print(f"\nTotal products fetched: {len(table_data)}")


if __name__ == "__main__":
    main()
