from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import CountVectorizer, TfidfTransformer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

categories = [
    'alt.atheism',
    'soc.religion.christian',
    'comp.graphics',
    'sci.med',
]
twenty_train = fetch_20newsgroups(
    subset='train', categories=categories, shuffle=True, random_state=42
)

X_train, X_test, y_train, y_test = train_test_split(
    twenty_train.data, twenty_train.target, test_size=0.25, random_state=42
)

text_clf = Pipeline(
    [
        ('vect', CountVectorizer()),
        ('tfidf', TfidfTransformer()),
        ('clf', MultinomialNB()),
    ]
)

text_clf.fit(X_train, y_train)

y_pred = text_clf.predict(X_test)

print(f'Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%\n')
print('Confusion Matrix:')
print(confusion_matrix(y_test, y_pred))
print('\nClassification Report:')
print(classification_report(y_test, y_pred, target_names=twenty_train.target_names))

sample_docs = ['OpenGL and 3D graphics rendering', 'Doctor prescribed antibiotics']
predictions = text_clf.predict(sample_docs)

for doc, category_idx in zip(sample_docs, predictions):
    print(f"'{doc}' => {twenty_train.target_names[category_idx]}")