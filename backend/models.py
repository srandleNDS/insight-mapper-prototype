import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

class Insight(db.Model):
    __tablename__ = 'insights'
    
    id = db.Column(db.Integer, primary_key=True)
    insight_name = db.Column(db.String(500), nullable=False)
    tab_name = db.Column(db.String(200))
    calculation = db.Column(db.Text)
    products_used_in = db.Column(db.ARRAY(db.String))
    product = db.Column(db.String(200))
    
    data_points = db.relationship('DataPoint', back_populates='insight', cascade='all, delete-orphan')

class DataPoint(db.Model):
    __tablename__ = 'data_points'
    
    id = db.Column(db.Integer, primary_key=True)
    insight_id = db.Column(db.Integer, db.ForeignKey('insights.id'), nullable=False)
    name = db.Column(db.String(500), nullable=False)
    ent_table = db.Column(db.String(300))
    ent_field = db.Column(db.String(300))
    ent_type = db.Column(db.String(100))
    calculation = db.Column(db.Text)
    
    insight = db.relationship('Insight', back_populates='data_points')
    source_mappings = db.relationship('SourceMapping', back_populates='data_point', cascade='all, delete-orphan')

class SourceMapping(db.Model):
    __tablename__ = 'source_mappings'
    
    id = db.Column(db.Integer, primary_key=True)
    data_point_id = db.Column(db.Integer, db.ForeignKey('data_points.id'), nullable=False)
    source_system = db.Column(db.String(200))
    source_name = db.Column(db.String(200))
    table = db.Column(db.String(300))
    field = db.Column(db.String(300))
    data_type = db.Column(db.String(100))
    source_type = db.Column(db.String(100))
    dd_table = db.Column(db.String(300))
    dd_field = db.Column(db.String(300))
    dd_type = db.Column(db.String(100))
    
    data_point = db.relationship('DataPoint', back_populates='source_mappings')
