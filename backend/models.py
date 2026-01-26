import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

class Insight(db.Model):
    __tablename__ = 'insights'
    
    id = db.Column(db.Integer, primary_key=True)
    insight_name = db.Column(db.String(500), nullable=False, unique=True)
    calculation = db.Column(db.Text)
    products_used_in = db.Column(db.ARRAY(db.String))
    
    data_points = db.relationship('DataPoint', secondary='insight_datapoints', back_populates='insights')

class DataPoint(db.Model):
    __tablename__ = 'data_points'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(500), nullable=False, unique=True)
    calculation = db.Column(db.Text)
    
    insights = db.relationship('Insight', secondary='insight_datapoints', back_populates='data_points')
    source_mappings = db.relationship('SourceMapping', back_populates='data_point', cascade='all, delete-orphan')

class InsightDataPoint(db.Model):
    __tablename__ = 'insight_datapoints'
    
    insight_id = db.Column(db.Integer, db.ForeignKey('insights.id'), primary_key=True)
    data_point_id = db.Column(db.Integer, db.ForeignKey('data_points.id'), primary_key=True)

class SourceMapping(db.Model):
    __tablename__ = 'source_mappings'
    
    id = db.Column(db.Integer, primary_key=True)
    data_point_id = db.Column(db.Integer, db.ForeignKey('data_points.id'), nullable=False)
    source_system = db.Column(db.String(200))
    source_name = db.Column(db.String(200))
    table = db.Column(db.String(200))
    field = db.Column(db.String(200))
    data_type = db.Column(db.String(100))
    
    data_point = db.relationship('DataPoint', back_populates='source_mappings')
